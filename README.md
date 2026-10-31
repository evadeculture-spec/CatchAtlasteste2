# CatchAtlas — protótipo

Aplicação web, pensada primeiro para telemóvel, para pesca desportiva de predadores de água doce em Portugal.
Tem duas áreas, ligadas por uma rotação em cubo semelhante à passagem entre Stories:

- **Prepara a tua jornada**: onde vou, em que condições e como me preparo.
- **Gera a tua história**: o que vivi, o que capturei e o que aprendi.

## Executar

```bash
npm install
npm run dev        # http://localhost:5173 (com --host, também acessível no telemóvel na mesma rede)
npm run build      # typecheck + build de produção em dist/
npm test           # testes unitários (narrativa e indicadores)
```

Não há backend, autenticação nem serviços pagos. Os dados ficam no dispositivo:
- `localStorage`: jornadas, capturas, narrativas, perfil e preferências;
- `IndexedDB`: fotografias (reduzidas a um máximo de 1600 px, nunca em base64 no localStorage).

## Publicar no Netlify

O ficheiro `netlify.toml` já tem tudo configurado:

1. No Netlify: **Add new site → Import an existing project** e escolhe este repositório.
2. O Netlify lê o `netlify.toml` (build `npm ci && npm run build`, pasta `dist`, Node 20). Não é preciso preencher nada.
3. Deploy.

Inclui: redirecionamento de SPA, cache imutável de 1 ano para `/assets/*` (ficheiros com hash), revalidação do
`index.html` a cada deploy, cabeçalhos de segurança (CSP sem origens externas, `X-Frame-Options`, `nosniff`,
`Permissions-Policy` que bloqueia geolocalização) e um web manifest para "Adicionar ao ecrã principal".

## Estrutura

```
src/
  components/CubeStage.tsx   transição em cubo (gesto, animação, acessibilidade)
  components/Header.tsx      marca, perfil e indicador de dois segmentos (tocável)
  components/AreaTitle.tsx   título de cada área, dentro da face (roda com o cubo)
  areas/                     as duas áreas principais
  sheets/                    vistas secundárias (planeador, plano, captura, história, perfil…)
  state/store.tsx            fonte única de verdade + persistência
  lib/                       narrativa local, indicadores, condições demonstrativas, cartão 9:16, fotos
  data/                      espécies, técnicas, locais e dados de exemplo
```

## Transição em cubo

- Pointer events + `transform` (perspetiva e `rotateY` em torno do centro do cubo); sem re-render do React durante o gesto.
- Só assume navegação com intenção horizontal clara; o scroll vertical é nativo (`touch-action: pan-y`).
- Conclui com 40 % da largura ou com um gesto rápido; caso contrário regressa. Duração final ~420 ms.
- Gestos iniciados em campos de edição são ignorados; um arrasto nunca ativa um botão.
- A face inativa fica `inert`, `aria-hidden` e invisível; cada área mantém a sua posição de scroll.
- Teclado: setas ← → (fora de campos) e o seletor (tablist). Arrastar com rato também funciona.
- `prefers-reduced-motion` (ou a opção no perfil) substitui a rotação por um cross-fade.

## O que é demonstrativo

- **Jornadas e capturas de exemplo**, marcadas com “Exemplo”. Remove-as em Perfil → “Limpar exemplos e começar do zero”.
- **Condições da jornada**: valores gerados de forma determinística, não são previsão. O nascer/pôr do sol é um cálculo aproximado.
- **Sugestão “comunitária”**: baseada em registos fictícios, identificada como exemplo.
- **Imagens dos locais e capas**: ilustrações SVG geradas localmente (identificadas como “Ilustração”). Para usar fotografias
  reais, acrescenta-as nas jornadas/capturas ou substitui as referências `art:*` em `src/data/constants.ts`.
- **Locais**: descrições genéricas; não indicam acessos, licenças nem restrições.

A narrativa “Gerar a minha história” é gerada localmente por modelos de texto, usando só os dados registados.
