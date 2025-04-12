import { join } from 'path'
import { readFile, writeFile, rm } from 'fs/promises'
import slugify from 'slugify';

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

import { PDFDocument } from 'pdf-lib';

// Define o caminho para o worker
GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.min.mjs"

export async function POST(request: Request) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return Response.json({ error: 'Nome do arquivo é obrigatório' }, { status: 400 })
    }

    const uploadsDir = join(process.cwd(), 'files')
    const filePath = join(uploadsDir, fileId)
    const buffer = await readFile(filePath)
    const array_buffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    const existingPdf = await PDFDocument.load(array_buffer);
    console.log(existingPdf.getPageCount(), 'existingPdf');

    try {
      const doc = await getDocument({ data: array_buffer }).promise;
      const numPages = doc.numPages;
      const resultados = [];

      // Loop através de todas as páginas
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const nome = slugify(textContent.items
          .filter((item): item is TextItem => 'str' in item)
          .map(item => item.str)
          .join(' '), {
          replacement: ' ',
          lower: true,
          strict: true,
          trim: true
        });

        console.log(`Página ${pageNum}: ${nome}`);

        try {
          const boleto = await prisma.boleto.findFirst({
            where: {
              nome_sacado: {
                contains: nome,
                mode: 'insensitive',
              },
            },
          });

          if (boleto) {
            resultados.push({
              pagina: pageNum,
              nome,
              boleto
            });

            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(existingPdf, [pageNum-1]);
            newPdf.addPage(copiedPage);
            writeFile(join(uploadsDir, `/pdf/${boleto.id}.pdf`), await newPdf.save());
          }
        } catch (error) {
          console.error(`Erro ao buscar boleto da página ${pageNum}:`, error);
          await rm('/caminho/para/pasta', { recursive: true, force: true });

          return Response.json(
            { error: 'Erro ao buscar boleto' },
            { status: 500 }
          );
        }
      }

      if (resultados.length === 0) {
        return Response.json(
          { error: 'Nenhum boleto encontrado' },
          { status: 404 }
        );
      }

      return Response.json({
        numPages,
        resultados
      });

    } catch (pdfError) {
      console.error('Erro ao processar PDF:', pdfError);
      return Response.json(
        { error: 'Erro ao processar PDF' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar arquivo:', error)
    return Response.json(
      { error: 'Erro ao processar arquivo' },
      { status: 500 }
    )
  }
}