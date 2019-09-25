export interface Child {
  readonly display: string
  readonly route: string
}

export interface Options {
  readonly title: string
  readonly children: readonly Child[]
}

export function homepage (options: Options) {
  const { title, children } = options

  const childContent = children.map(child => `
    <li class='child'><a href='${child.route}'>
      ${child.display}
    </a></li>
  `).join('\n')

  const css = `
    body {
      font-family: sans-serif;
    }

    header .title {
      text-align: center;
    }

    a {
      color: #6495ed;
    }

    .npm {
      color: red;
    }
  `

  const html = `
    <!DOCTYPE html>
    <html xmlns='http://www.w3.org/xhtml'>
      <head>
        <meta charset='UTF-8' />
        <title>${title}</title>
        <style>${css}</style>
      </head>
      <body>
        <header>
          <h1 class='title'>${title}</h1>
        </header>
        <main>
          <ul>${childContent}</ul>
        </main>
      </body>
    </html>
  `

  return html
}

export default homepage
