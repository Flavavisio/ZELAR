# Zelar

Plataforma experimental de acompanhamento domiciliário de idosos, com planta 2D e previsão de integração com sensores Aqara.

## Interface web (HTML, CSS e JavaScript)

- [index.html](index.html) — página inicial
- [login.html](login.html) — acesso **apenas de demonstração**
- [admin.html](admin.html) — painel de administração com habitações, equipamentos, planta 2D e alertas simulados
- [styles.css](styles.css) — estilos responsivos
- [app.js](app.js) — navegação e interações de demonstração

Para experimentar, descarrega/clona o repositório e abre `index.html` num navegador. Usa os dados **fictícios** apresentados na própria página de login. Os registos feitos na demonstração ficam apenas na sessão do navegador; não são persistidos no servidor.

> **Segurança:** o login atual é uma simulação no JavaScript, não uma autenticação real. Não utilizar dados pessoais verdadeiros. A página de administração não dispõe ainda de controlo de acesso no servidor. Não publicar como serviço real de acompanhamento.

## API experimental

O ficheiro `app.py` contém uma API local Python/SQLite independente do front-end. Ainda **não está ligada** às páginas HTML. Requer duas chaves diferentes definidas por variáveis de ambiente. Consultar `.env.example`. Por defeito é acessível apenas localmente.

## Desenvolvimento por realizar

1. Autenticação e autorização reais no servidor, incluindo perfis por empresa e familiar.
2. Ligação segura entre interface web e backend, com isolamento entre habitações.
3. Integração Aqara Hub M3 via Matter Bridge e validação de eventos suportados.
4. Integração particular do FP2 (Wi-Fi/HomeKit) e validação de alertas de queda.
5. RGPD, notificações, auditoria, resiliência e validação com hardware real.
6. Publicação num ambiente de teste privado.

**Não é um sistema de emergência.** Sem ligações reais, notificações ou validação física. Não utilizar para proteção de pessoas.

O repositório é público. Não carregar credenciais, ficheiros SQLite, dados de saúde nem nomes reais de idosos.


## Perfis web de demonstração

- `superadmin.html`: empresas, utilizadores, planos, catálogo de equipamentos, estado técnico e auditoria.
- `empresa.html`: idosos, habitações, plantas 2D, sensores, alertas e equipa.
- `familiar.html`: acompanhamento de familiar autorizado (simulado), **planta 2D interativa**, atividade, alertas e resumos.
- `profiles.css` e `profiles.js`: componentes, navegação e estados fictícios para os três painéis.
- `login.html`: seleção de perfil e credenciais de demonstração.

**Muito importante:** a seleção de perfil e as credenciais estão no navegador e podem ser contornadas. Não existe autenticação ou autorização real e não devem ser guardados dados pessoais. O isolamento de empresas, familiares e idosos deverá ser validado no servidor, nunca apenas no JavaScript. As plantas e os sensores ainda utilizam dados simulados.

## Registo de tempo por divisão (demonstração)

Nos painéis Empresa e Familiar, a planta 2D acompanha a duração da presença simulada na divisão atual. O botão **Simular deslocação** encerra a passagem anterior e regista hora de entrada, hora de saída e duração; a passagem seguinte inicia novo contador. O painel apresenta histórico das passagens e tempo acumulado por divisão. Os dados de demonstração ficam apenas no `sessionStorage` do navegador e não são partilhados entre dispositivos nem guardados no backend.

Na futura integração Aqara, os tempos deverão ser calculados a partir de eventos com carimbo temporal e confirmação de presença, tratando perda de sinal, múltiplas pessoas e possíveis falsas deteções. A interface não deve afirmar uma localização precisa ou presença contínua sem confirmação dos sensores.

## Planta 3D interativa (nova)

Acede através da **Planta 2D → Abrir planta 3D interativa** nos painéis Empresa e Familiar, ou abre `planta3d.html` após iniciar sessão de demonstração.

- Modelo 3D da casa com quatro divisões e mobiliário simplificado.
- Three.js (módulos carregados da CDN esm.sh): rotação, zoom e reposição de orientação.
- Identificador visual de presença *simulada* na divisão atual.
- Duração da passagem atual, tempo acumulado por divisão e tabela de entradas/saídas.
- Botão para simular deslocações; os dados de permanência são partilhados com a planta 2D através de `sessionStorage`.
- Layout responsivo para computador e telemóvel.
- Precisa de Internet para carregar Three.js; apresenta visualização simplificada quando não consegue carregar o módulo.

**Estado:** apenas demonstração. Os móveis e paredes são fictícios e não correspondem à planta real de uma habitação. Não existe ainda editor de plantas, ligação física a Aqara, sincronização entre dispositivos ou informação clínica fiável. A aplicação não deve ser utilizada para emergências.

## Seguimento por zonas na planta 3D

A demonstração permite escolher sofá, mesa, portas, cama, bancada e casa de banho; a figura move-se suavemente entre os pontos e um percurso automático apresenta a mudança de zonas. O histórico atual continua a contar **permanência por divisão**, não tempos por zona. A localização é **simulada** e os eventos reais continuam pendentes de integração. Ver [contrato de eventos e limitações](docs/aqara-zonas.md).
