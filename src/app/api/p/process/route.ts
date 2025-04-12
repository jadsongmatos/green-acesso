import { readFile } from 'fs/promises'
import { join } from 'path'
import Papa from 'papaparse'
import { PrismaClient } from '@prisma/client'

interface CsvRow {
  nome: string;
  unidade: string;
  valor: string;
  linha_digitavel: string;
}

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json()
    
    if (!fileId) {
      return Response.json({ error: 'Nome do arquivo é obrigatório' }, { status: 400 })
    }

    // Define o caminho para a pasta onde os arquivos estão armazenados
    const uploadsDir = join(process.cwd(), 'files')
    const filePath = join(uploadsDir, fileId)
    const fileContent = await readFile(filePath, 'utf-8')

    const { data } = Papa.parse<CsvRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: ';'
    })

    // Insere os dados no banco
    const boletos = await prisma.boleto.createMany({
      data: data.map((row) => ({
        nome_sacado: row.nome,
        id_lote: parseInt(row.unidade),
        valor: parseFloat(row.valor),
        linha_digitavel: row.linha_digitavel,
        ativo: true
      }))
    })

    return Response.json({ 
      success: true, 
      message: `${boletos.count} boletos importados com sucesso`
    })

  } catch (error) {
    console.error('Erro ao processar arquivo:', error)
    return Response.json(
      { error: 'Erro ao processar arquivo' }, 
      { status: 500 }
    )
  }
}