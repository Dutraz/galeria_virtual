const fs = require('fs').promises
const fse = require('fs-extra')
let dir_archives = './archives'


function joinPath(path1, path2) {
    return path1 + '/' + path2
}


let parts = {}
async function getParts() {
    dir_parts = 'html-generator/parts/'
    part_files = await fs.readdir(dir_parts)
    for (part of part_files) {
        parts[part] = await fs.readFile(dir_parts + part, "utf-8")
    }
    console.log('HTML-PARTS - ', part_files)
}


async function createHTML(part, attrs) {
    part = parts[part]
    for (const attr in attrs) {
        part = part.split('#' + attr + "#").join(attrs[attr])
    }
    return part
}


async function clearDir(dir) {
    try {
        await fse.emptyDir(dir)
        console.log('Pasta limpa com sucesso! dir:', dir)
    } catch (err) {
        console.error(err)
    }
}


async function copyFiles(origin, dir) {
    try {
        await fse.copy(origin, dir)
        console.log('Arquivo(s) copiado(s) com sucesso! dir', dir)
    } catch (err) {
        console.error(err)
    }
}

async function pageContent() {
    await getParts()
    await clearDir('./page-result/img/activities/')

    let pageContent = ''
    let turmas = await fs.readdir(dir_archives)

    for (const turma of turmas) {
        let dir_turma = joinPath(dir_archives, turma)

        let turma_nome = await fs.readFile(joinPath(dir_turma, 'desc.txt'), 'utf8')
        pageContent += await createHTML('class.html', {
            'TURMA': turma,
            'TURMA-DESC': turma_nome
        })

        let atividades = (await fs.readdir(dir_turma)).filter(i => i != 'desc.txt')

        for (atividade of atividades) {
            let dir_atividade = joinPath(dir_turma, atividade)
            let dir_result = joinPath(turma, atividade)
            let dir_imgs = joinPath('./page-result/img/activities', dir_result)

            let arquivos = await fs.readdir(dir_atividade)
            let ativDesc = JSON.parse(await fs.readFile(joinPath(dir_atividade, 'desc.txt'), 'utf8'))
            let descImgName = arquivos.filter(f => f.includes('desc-img'))
            let descImg = joinPath(dir_result, descImgName)
            let pictures = await fs.readdir(dir_atividade + '/pictures')
            let carouselItens = ''

            await copyFiles(joinPath(dir_atividade, 'pictures'), dir_imgs)
            await copyFiles(joinPath(dir_atividade, descImgName), joinPath(dir_imgs, descImgName))

            for (pic of pictures) {
                let aluno = pic.substr(0, pic.indexOf('.'))
                carouselItens += await createHTML('carousel-item.html', {
                    'CAROUSEL-ACTIVE': pic == pictures[0] ? 'active' : '',
                    'CAROUSEL-PIC-DIR': joinPath(dir_result, pic),
                    'CAROUSEL-CAPTION': aluno.replace(/[0-9]|-|_/gi,' ').replace(/  +/g, ' ').toUpperCase()
                })
            }

            pageContent += await createHTML('activity.html', {
                'ATIVIDADE': ativDesc.nome,
                'DISCIPLINA': ativDesc.disciplina,
                'PROFESSOR': 'Prof. ' + ativDesc.professor,
                'DESC': ativDesc.desc,
                'DESC-IMG': descImg,
                'CAROUSEL-NAME': turma + atividade,
                'CAROUSEL-ITENS': carouselItens
            })
        }
    }
    fs.writeFile('page-result/index.html', await createHTML('page.html', { 'PAGE-CONTENT': pageContent }))
}

pageContent()