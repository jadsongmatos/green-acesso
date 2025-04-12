/*
  Warnings:

  - You are about to drop the column `nome` on the `Lote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[unidade]` on the table `Lote` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Lote" DROP COLUMN "nome",
ADD COLUMN     "unidade" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Lote_unidade_key" ON "Lote"("unidade");
