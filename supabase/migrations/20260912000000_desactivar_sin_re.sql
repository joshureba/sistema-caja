-- "SIN RE" deja de ser elegible en registros nuevos; el histórico lo conserva.
update public.catalogos set activo = false where tipo = 'COMPROBANTE' and valor = 'SIN RE';
