-- Garantiza que el numero de documento de identidad sea unico en toda la tabla.
ALTER TABLE "PERSON_DOCUMENT"
ADD CONSTRAINT "PERSON_DOCUMENT_document_number_key" UNIQUE ("document_number");
