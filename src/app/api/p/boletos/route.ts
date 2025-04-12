import { z } from 'zod'

import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'

import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

// Define the query parameters schema
const querySchema = z.object({
  nome: z.string().optional(),
  relatorio: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  valor_inicial: z.string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine(
      (val) => !val || !isNaN(val),
      { message: "Valor inicial deve ser um número válido" }
    ),
  valor_final: z.string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine(
      (val) => !val || !isNaN(val),
      { message: "Valor final deve ser um número válido" }
    ),
  id_lote: z.string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined))
    .refine(
      (val) => !val || !isNaN(val),
      { message: "ID do lote deve ser um número válido" }
    ),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Convert searchParams to object
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validate and parse query parameters
    const validatedQuery = querySchema.safeParse(queryParams)

    if (!validatedQuery.success) {
      return Response.json(
        {
          error: 'Validation error',
          details: validatedQuery.error.format()
        },
        { status: 400 }
      )
    }

    const { nome, valor_inicial, valor_final, id_lote, relatorio } = validatedQuery.data

    // Build where clause based on validated filters
    const where: Prisma.BoletoWhereInput = {
      ativo: true
    }

    if (nome) {
      where.nome_sacado = {
        contains: nome,
        mode: 'insensitive'
      }
    }

    if (valor_inicial || valor_final) {
      where.valor = {}
      if (valor_inicial) {
        where.valor.gte = valor_inicial
      }
      if (valor_final) {
        where.valor.lte = valor_final
      }
    }

    if (id_lote) {
      where.id_lote = id_lote
    }

    // Query boletos with filters
    const boletos = await prisma.boleto.findMany({
      where,
      include: {
        lote: true
      }
    })

    // ...existing code...

    if (relatorio === 1) {
      // Create new PDF document
      const doc = new jsPDF()

      // Define the table headers
      const headers = [
        ['id', 'nome_sacado', 'id_lote', 'valor', 'linha_digitavel']
      ]

      // Transform boletos data into table rows
      const rows = boletos.map(boleto => [
        boleto.id,
        boleto.nome_sacado,
        boleto.id_lote,
        `R$ ${boleto.valor.toFixed(2)}`,
        boleto.linha_digitavel
      ])

      // Add title to PDF
      doc.setFontSize(16)
      doc.text('Relatório de Boletos', 14, 15)

      // Create table
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 25,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      })

      // Return boletos with PDF data
      return Response.json({
        boletos,
        base64: doc.output('datauristring').split(',')[1]
      })
    }

    return Response.json({ boletos })
  } catch (error) {
    console.error('Error fetching boletos:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}