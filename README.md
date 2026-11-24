# LP IDeia

Landing page institucional da IDeia. Página estática em HTML e CSS, sem framework e sem etapa de build: o que está neste repositório é exatamente o que vai para o ar (ADR-001).

- Plano técnico: https://ideia.atlassian.net/wiki/spaces/PI/pages/3637250
- Épico no Jira: https://ideia.atlassian.net/browse/IFI-9
- Design: Figma `8cGrLRtEjwK6Q3KkjamzSC`, página "LP IDeia · 2.0 · proposta órbita", frame "Site IDeia 2.0 · desktop 1440" (LP 2.0, IFI-72)

## Estrutura

```
index.html        página única
assets/css/       estilos (tokens do design system em :root)
assets/js/        só se for necessário
assets/img/       WebP e SVG exportados do Figma
assets/fonts/     Manrope variável em WOFF2, subconjunto latino
vercel.json       cabeçalhos de segurança e cache (T6)
```

## Rodar localmente

Qualquer servidor estático serve. Com Python, que já vem no macOS e na maioria dos Linux:

```sh
python3 -m http.server 8080
```

Depois abra http://localhost:8080. Abrir o `index.html` direto no navegador funciona para olhar, mas caminhos e cabeçalhos podem se comportar diferente do servidor.

## Validar o HTML

Precisa de Node 22 ou mais novo.

```sh
npm install
npm run validate
```

## Imagens e ícones

Os SVGs de `assets/img/` (logo e ícones) e o `favicon.svg` da raiz vêm do protótipo v09 no Figma. Para trocar um deles, exporte de novo o componente como SVG, salve por cima do arquivo com o mesmo nome e rode:

```sh
python3 scripts/otimizar-svg.py assets/img/icone-*.svg favicon.svg
CASAS=3 python3 scripts/otimizar-svg.py assets/img/logo-ideia.svg assets/img/icone-whatsapp.svg
```

O script só arredonda coordenadas, renomeia os ids de gradiente e tira espaços; o desenho não muda.

O `apple-touch-icon.png` (180 × 180) fica na raiz porque o iOS procura esse caminho mesmo sem `<link>`.

As ilustrações (`boy`, `girl`, `duo`, `3d`) ficam em WebP, em duas larguras cada (o tamanho exibido no desktop e o dobro). Para trocar, exporte do Figma o componente "IDeia DS/Asset/..." da página "IDeia · Design System v1" em PNG 2x, salve numa pasta como `boy.png`, `girl.png` etc. e rode (precisa de Pillow). O PNG certo do boy tem 1080 × 720.

```sh
python3 scripts/gerar-webp.py <pasta-com-os-png>
```

Peças do banner da LP 2.0 (frame "Hero · órbita", 133:20):

- `personagem-notebook-*.webp` e `personagem-bolso-*.webp`: as duas poses em pé, recortadas na área visível do PNG do Figma, na altura original e na metade.
- `aurora.webp`: a aurora que gira dentro da esfera, reduzida para 420 px porque é toda desfocada. O arquivo já traz os 42% de opacidade do Figma; o contato usa a mesma imagem com opacidade menor.
- `fundo-espacial.svg`: a camada "Fundo · nebulosas e estrelas", passada pelo `otimizar-svg.py`.

Os anéis tracejados, a esfera, a grade e as estrelas são desenhados em CSS e SVG no próprio `index.html`, com as medidas do Figma.

`fundo-1920.webp` e `hero-1600.webp` só ficam no repositório porque a página `scripts/og/og.html` usa as duas.

A imagem de compartilhamento `assets/img/og-ideia.jpg` (1200 × 630) é um print de `scripts/og/og.html`, que junta a hero e o logo. Se a hero ou o logo mudarem, abra essa página no servidor local com a janela em 1200 × 630, tire o print e salve como JPG.

## Fonte

`assets/fonts/manrope-latin.woff2` é a Manrope variável do Google Fonts, limitada aos pesos 400 a 800 e ao subconjunto latino (cobre português, aspas, travessões e €). O `@font-face` está no início de `assets/css/tokens.css`. Para gerar de novo a partir do `Manrope-VariableFont_wght.ttf` do Google Fonts, com `fonttools` e `brotli` instalados:

```sh
python3 -m fontTools.varLib.instancer Manrope-VariableFont_wght.ttf wght=400:800 -o manrope-400-800.ttf
pyftsubset manrope-400-800.ttf --layout-features='*' --flavor=woff2 --output-file=assets/fonts/manrope-latin.woff2 \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
```

## Movimento

Todo o movimento está em `assets/css/estilos.css` (seção 09) e em `assets/js/movimento.js`. As durações vêm das notas amarelas do Figma e ficam em `tokens.css` (`--loop-*`).

- Com "reduzir movimento" ligado no sistema, nada se move e o botão de pausa não aparece.
- O botão "Pausar animações", no pé do banner, para tudo o que se move sozinho na página.
- Sem JavaScript, a página aparece estática e completa, com os links do menu visíveis.

## Checks do CI

O workflow `.github/workflows/ci.yml` roda em todo pull request e em todo push na `main`, com dois checks:

1. **Validar HTML:** `npm run validate` (html-validate, regras recomendadas).
2. **Verificar links internos:** lychee em modo offline, que confere links e âncoras entre arquivos do próprio site sem acessar a internet.

Para rodar a verificação de links localmente, instale o [lychee](https://lychee.cli.rs) e execute:

```sh
lychee --offline --include-fragments --exclude-path node_modules './**/*.html'
```

## Publicar

A publicação é automática pela Vercel (projeto `lp-ideia`, time `id-eia`, plano pago), ligada a este repositório. Não há etapa de build: a Vercel serve os arquivos como estão.

1. Crie uma branch por ticket, por exemplo `ifi-22-estrutura`.
2. Abra um pull request para a `main`. A Vercel publica um preview só daquele PR e comenta o endereço no próprio PR (formato `lp-ideia-git-<branch>-id-eia.vercel.app`). O QA é feito ali.
3. Com os checks verdes, faça o merge. A `main` publica em produção.

Produção, até o domínio próprio entrar (T10): https://lp-ideia.vercel.app

Os endereços `*.vercel.app` estão protegidos pelo login da Vercel ("Vercel Authentication"), então só quem é do time consegue abrir. O domínio `ideia.tec.br`, quando for ligado, fica público.

## Reverter

- **Mais rápido:** no painel da Vercel, abra o projeto `lp-ideia`, vá em Deployments, escolha a publicação anterior e use "Promote to Production" (ou "Instant Rollback").
- **Pelo Git:** reverta o commit ou o merge do PR na `main` (`git revert`), o que publica de novo a versão anterior.
