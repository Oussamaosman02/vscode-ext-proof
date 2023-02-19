const vscode = require('vscode')
const axios = require('axios')
const { XMLParser } = require('fast-xml-parser')
const cheerio = require('cheerio')
/**
 * @param {vscode.ExtensionContext} context
 */

async function activate (context) {
  const parser = new XMLParser()
  async function contenido (cont) {
    const resul = await axios.get(cont)
    return resul.data
  }
  async function some (conten) {
    const content = await contenido(conten)
    const $ = cheerio.load(content)
    const cabeza = $('head')
    const codigo = $('code')
    return `
    <!DOCTYPE html>
    <html lang="es"
    ${cabeza}
    <body>
    <div style="display: flex;flex-direction: column;justify-content: center;gap: 30px;" >
      ${codigo}
    </div>
    </body>
    </html>
    `
  }
  const res = await contenido('https://zonabit.net/sitemap.xml')

  const articulos = await Promise.all(parser.parse(res).urlset.url.map(async (arg) => {
    const detalls = await contenido(arg.loc)
    const $ = cheerio.load(detalls)
    const titu = $('title').text()
    return ({
      label: titu,
      detail: arg.loc
    }
    )
  }))

  const disposable = vscode.commands.registerCommand('prueba-5627.zonabit', async function () {
    const article = await vscode.window.showQuickPick(articulos, {
      placeHolder: 'Escoge el artículo a visualizar'
    })

    if (article == null) return
    // vscode.window.showInformationMessage(article.label)
    const panel = vscode.window.createWebviewPanel(
      'zonabit',
      'ZonaBit.Net',
      vscode.ViewColumn.Beside,
      {}
    )

    panel.webview.html = await some(article.detail)
  })

  const disp = vscode.commands.registerCommand('prueba-5627.zonabit-go', async function () {
    const article = await vscode.window.showQuickPick(articulos, {
      matchOnDetail: true,
      placeHolder: 'Escoge el artículo a visitar en la web'
    })

    if (article == null) return

    vscode.env.openExternal(article.detail)
  })
  context.subscriptions.push({ disposable, disp })
}

function deactivate () {}

module.exports = {
  activate,
  deactivate
}
