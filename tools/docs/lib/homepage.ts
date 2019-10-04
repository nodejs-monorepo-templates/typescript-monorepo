import pretty from 'pretty'

export interface Child {
  readonly name: string
  readonly version: string
  readonly description: string
  readonly route: string
  readonly npm: string
}

export interface Options {
  readonly title: string
  readonly children: readonly Child[]
  readonly repo: string
}

function dataAttributes (data: { readonly [_: string]: any }) {
  return Object
    .entries(data)
    .map(([key, value]) => `data-${key}=${JSON.stringify(value)}`)
    .join(' ')
}

export function homepage (options: Options) {
  const { title, children, repo } = options

  const childContent = children.map(child => `
    <li class='child' ${dataAttributes(child)}><article>
      <a class='link name' target='${child.name}' href='${child.route}'>${child.name}</a>
      <span class='version' title='version'>${child.version}</span>
      <a class='npm' title='npm page' target='_blank' href='${child.npm}'>[npm]</a>
      <p class='description'><span title='package description'>${child.description}</span></p>
    </article></li>
  `).join('\n')

  const css = `
    body {
      font-family: sans-serif;
    }

    header .title {
      text-align: center;
    }

    footer {
      text-align: center;
    }

    a {
      color: #6495ed;
    }

    .child .name {
      font-size: 1.0875rem;
      font-weight: bold;
    }

    .child .npm {
      color: red;
      text-decoration: none;
      font-size: 0.875rem;
    }

    .child .version {
      font-size: 0.875rem;
      color: rgba(0,0,0,0.5);
      font-weight: bold;
      max-width: 90px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      vertical-align: middle;
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
        <main><nav>
          <ul>${childContent}</ul>
        </nav></main>
        <footer>
          <hr />
          <a title='Repository' target='_blank' href='${repo}'>${repo}</a>
        </footer>
      </body>
    </html>
  `

  return pretty(html, { ocd: true })
}

export default homepage
