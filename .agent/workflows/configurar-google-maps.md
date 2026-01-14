---
description: Configurar o Módulo de Logística (Google Maps)
---

Para ativar o mapa interativo no módulo de Logística, siga estes passos:

1. **Obter API Key**: Aceda à [Google Cloud Console](https://console.cloud.google.com/), crie um projeto e ative a "Maps JavaScript API". Crie uma credencial de chave de API.
2. **Configurar Variável de Ambiente**:
    - Abra o ficheiro `frontend/.env.local`
    - Adicione a linha: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=SUA_CHAVE_AQUI`
3. **Atualizar Base de Dados**: No SQL Editor do Supabase, execute o comando (caso ainda não o tenha feito):

    ```sql
    ALTER TABLE sites ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
    ALTER TABLE sites ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    ```

4. **Verificar na App**: Aceda ao separador "Logística" na sidebar para visualizar as unidades no mapa.
