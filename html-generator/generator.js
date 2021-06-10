const fs = require('fs').promises
const fse = require('fs-extra')
let dir_archives = '../archives'


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


function createHTML(part, attrs) {
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
        let atividades = (await fs.readdir(dir_turma)).filter(i => i != 'desc.txt')
        let content_atividades = ''

        for (atividade of atividades) {
            let dir_atividade = joinPath(dir_turma, atividade)
            let dir_result = joinPath(turma, atividade)
            let dir_imgs = joinPath('./page-result/img/activities', dir_result)

            let arquivos = await fs.readdir(dir_atividade)
            let ativDesc = JSON.parse(await fs.readFile(joinPath(dir_atividade, 'desc.txt'), 'utf8'))

            let descImgName = arquivos.filter(f => f.includes('desc-img'))[0]
            let descMedia
            if (arquivos.includes(descImgName)) {
                await copyFiles(joinPath(dir_atividade, descImgName), joinPath(dir_imgs, descImgName))
                descMedia = createHTML('activity-desc-image.html', { 'DESC-IMG-DIR': joinPath(dir_result, descImgName) })
            } else {
                descMedia = createHTML('activity-desc-yt-video.html', { 'YT-LINK': ativDesc.descYtVideo.replace('watch?v=', 'embed/') })
            }

            let medias = []
            if (arquivos.includes('pictures')) {
                await copyFiles(joinPath(dir_atividade, 'pictures'), dir_imgs)
                console.log('Atividade contém Imagens')
                let pictures = await fs.readdir(dir_atividade + '/pictures')

                for (pic of pictures) {
                    let aluno = pic.substr(0, pic.indexOf('.')).replace(atividade,' ').replace(/[0-9]|-|_|\(|\)/gi, ' ').replace(/  +/g, ' ').toUpperCase()
                    let html = createHTML('carousel-item-img.html', { 'CAROUSEL-IMG-DIR': joinPath(dir_result, pic) })
                    medias.push([aluno, html])
                }
            }

            if (arquivos.includes('yt-videos.txt')) {
                let videos = JSON.parse(await fs.readFile(joinPath(dir_atividade, 'yt-videos.txt'), 'utf8'))
                console.log('Atividade contém Vídeos do Youtube')

                for (video in videos) {
                    let link = videos[video].replace('watch?v=', 'embed/')
                    let html = createHTML('carousel-item-yt-video.html', { 'CAROUSEL-YT-LINK': link })
                    medias.push([video, html])
                }
            }

            let carouselItens = ''
            for (media of medias) {
                carouselItens += createHTML('carousel-item.html', {
                    'CAROUSEL-ACTIVE': media == medias[0] ? 'active' : '',
                    'CAROUSEL-ITEM-MEDIA': media[1],
                    'CAROUSEL-CAPTION': media[0]
                })
            }

            content_atividades += createHTML('activity.html', {
                'ATIVIDADE': ativDesc.nome,
                'DISCIPLINA': ativDesc.disciplina,
                'PROFESSOR': 'Prof. ' + ativDesc.professor,
                'DESC': ativDesc.desc,
                'DESC-MEDIA': descMedia,
                'CAROUSEL-NAME': turma + atividade,
                'CAROUSEL-ITENS': carouselItens
            })
        }
        pageContent += createHTML('class.html', {
            'TURMA': turma,
            'TURMA-DESC': turma_nome,
            'ATIVIDADES': content_atividades
        })
    }
    fs.writeFile('page-result/index.html', createHTML('page.html', { 'PAGE-CONTENT': pageContent }))
}

pageContent()