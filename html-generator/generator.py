from os import listdir, mkdir
import shutil
import json
import re
from unicodedata import normalize

DIRRESULT = './page-result/img/activities/'
DIRPARTS = 'html-generator/parts/'
DIRARQUIVOS = '../archives/'


def criaHTML(parte, atribs):
    parte = partes[parte]
    for a in atribs:
        parte = parte.replace(f'#{a}#', atribs[a])
    return parte


def nomeArquivo(txt):
    return normalize('NFKD', txt).encode('ASCII', 'ignore').decode('ASCII')


def nomeAluno(txt, ativ):
    nome = txt[:txt.index('.')].replace(ativ, '')
    return re.sub(r'[0-9]|-|_|\(|\)|  +', ' ', nome).strip()


def path(*dir):
    return '/'.join([*dir]).replace('//', '/')


def leJSON(dir):
    with open(dir, encoding='utf8') as f:
        return json.load(f)


def embedYtLink(link):
    return link.replace('watch?v=', 'embed/')


# --------------------------------------------------
# LIMPA O DIRETÓRIO DAS IMAGENS EM PAGE-RESULT

try:
    shutil.rmtree(DIRRESULT)
    mkdir(DIRRESULT)
except OSError as e:
    print(e)
else:
    print("O diretório das imagens foi limpo com sucesso!")


# --------------------------------------------------
# IMPORTA OS MODELOS(PARTES) EM HTML

partes = {}
arqsPartes = listdir(DIRPARTS)

for nomeArq in arqsPartes:
    with open(path(DIRPARTS, nomeArq), encoding='utf8') as f:
        partes[nomeArq] = ''.join(f.readlines())

print('PARTES-HTML - ', arqsPartes)


# --------------------------------------------------
# HTML - FUNCTIONS


def carouselHTML(DIR, turma, ativ):
    medias = []
    MEDIAITENS = listdir(DIR)

    if 'pictures' in MEDIAITENS:
        for pic in listdir(path(DIR, 'pictures')):
            html = criaHTML('carousel-item-img.html', {
                'CAROUSEL-IMG-DIR': path(turma, ativ, nomeArquivo(pic))
            })
            medias.append([nomeAluno(pic, ativ), html])

            shutil.copyfile(
                path(DIRARQUIVOS, turma, ativ, 'pictures', pic),
                path(DIRRESULT, turma, ativ, nomeArquivo(pic))
            )

    if 'yt-videos.txt' in MEDIAITENS:
        for nome, link in leJSON(path(DIR, 'yt-videos.txt')).items():
            html = criaHTML('carousel-item-yt-video.html', {
                'CAROUSEL-YT-LINK': embedYtLink(link)
            })
            medias.append([nome, html])

    html = ''
    for m in medias:
        html += criaHTML('carousel-item.html', {
            'CAROUSEL-ACTIVE': ' active' if m == medias[0] else '',
            'CAROUSEL-CAPTION': m[0].upper(),
            'CAROUSEL-ITEM-MEDIA': m[1]
        })
    return html


def descMediaHTML(DIR, desc, turma, ativ):
    if 'desc-img.jpg' in listdir(DIR):
        shutil.copy(path(DIR, 'desc-img.jpg'), path(DIRRESULT, turma, ativ, 'desc-img.jpg'))
        return criaHTML('activity-desc-image.html', {
            'DESC-IMG-DIR': path(turma, ativ, 'desc-img.jpg')
        })
    else:
        return criaHTML('activity-desc-yt-video.html', {
            'YT-LINK': embedYtLink(desc['descYtVideo'])
        })


def atividadesHTML(DIR, turma):
    html = ''
    for ativ in listdir(DIR):
        if ativ != 'desc.txt':
            DIRATIV = path(DIR, ativ)
            desc = leJSON(path(DIRATIV, 'desc.txt'))
            print('  ', ativ, desc)

            mkdir(path(DIRRESULT, turma, ativ))
            print(f'mkdir - {path(DIR, ativ)}')

            html += criaHTML('activity.html', {
                'ATIVIDADE': desc['nome'],
                'DISCIPLINA': desc['disciplina'],
                'PROFESSOR': 'Prof. ' + desc['professor'],
                'DESC': desc['desc'],
                'DESC-MEDIA': descMediaHTML(DIRATIV, desc, turma, ativ),
                'CAROUSEL-NAME': turma + ativ,
                'CAROUSEL-ITENS': carouselHTML(DIRATIV, turma, ativ)
            })
    return html


# --------------------------------------------------
# MAIN


print('\n', 200*'-', '\n')

html = ''
for turma in listdir(DIRARQUIVOS):
    DIRTURMA = path(DIRARQUIVOS, turma)
    desc = leJSON(path(DIRTURMA, 'desc.txt'))['nome']
    print(turma, desc, '\n')

    mkdir(path(DIRRESULT, turma))
    print(f'mkdir - {path(DIRRESULT, turma)}')

    html += criaHTML('class.html', {
        'TURMA': turma,
        'TURMA-DESC': desc,
        'ATIVIDADES': atividadesHTML(DIRTURMA, turma)
    })


print('\n', 200*'-', '\n')

pageHTML = criaHTML('page.html', {
    'PAGE-CONTENT': html
})
print(pageHTML)

with open('./page-result/index.html', "w", encoding='utf8') as f:
    f.write(pageHTML)
