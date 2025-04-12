import { readFile } from 'fs/promises'
import { join } from 'path'
import Papa from 'papaparse'
import { z } from 'zod';
import slugify from 'slugify';

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return Response.json({ error: 'Nome do arquivo é obrigatório' }, { status: 400 })
    }

    const uploadsDir = join(process.cwd(), 'files')
    const filePath = join(uploadsDir, fileId)
    const fileContent = await readFile(filePath, 'utf-8')

    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';'
    })

    // Define o schema para cada linha do CSV
    const rowSchema = z.object({
      nome: z.string(),
      unidade: z.coerce.number(),
      valor: z.coerce.number(),
      linha_digitavel: z.string(),
      id_lote: z.number().optional(),
    });

    // Define o schema para o array de linhas
    const csvSchema = z.array(rowSchema);

    // Valida os dados
    const resultado = csvSchema.safeParse(data);

    if (!resultado.success) {
      console.error('Erro na validação do CSV:', resultado.error);
      return Response.json(
        { error: 'Erro na validação do CSV', details: resultado.error.format() },
        { status: 400 }
      )
    }

    console.log('CSV validado com sucesso!', resultado.data);


    const new_lotes = resultado.data.map((row: { unidade: number; }) => ({
      unidade: row.unidade,
      ativo: true,
    }));

    for (let i = 0; i < new_lotes.length; i++) {
      try {
        const save_lote = await prisma.lote.create({
          data: new_lotes[i],
        });

        resultado.data[i].id_lote = save_lote.id;
      } catch (e) {
        if ((e as { code: string }).code !== 'P2002') {
          throw e;
        }
        // Se o lote já existe, busca o ID correspondente
        const loteExistente = await prisma.lote.findFirst({
          where: {
            unidade: resultado.data[i].unidade,
            ativo: true,
          },
        });
        if (loteExistente) {
          resultado.data[i].id_lote = loteExistente.id;
        }
      }
    }

    console.log('Dados', data)
    
    if (resultado.data.some((row) => row.id_lote === undefined)) {
      return Response.json(
        { error: 'Erro ao processar arquivo' },
        { status: 400 }
      )
    }

    const boletos = await prisma.boleto.createMany({
      data: resultado.data.map((row: {
        nome: string;
        unidade: number;
        valor: number;
        linha_digitavel: string;
        id_lote?: number;
      }) => ({
        nome_sacado: slugify(row.nome, {
          replacement: ' ',
          lower: true,    
          strict: true,   
          trim: true        
        }),
        id_lote: row.id_lote!,
        valor: row.valor,
        linha_digitavel: row.linha_digitavel,
        ativo: true
      }))
    })

    return Response.json(boletos)
  } catch (error) {
    console.error('Erro ao processar arquivo:', error)
    return Response.json(
      { error: 'Erro ao processar arquivo' },
      { status: 500 }
    )
  }
}