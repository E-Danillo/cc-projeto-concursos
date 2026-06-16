## 📋 CC Projeto Concursos

Aplicação web para visualizar concursos públicos abertos.  
O usuário acessa a página e visualiza uma listagem de concursos disponíveis, com dados simulados fornecidos pela API JSONPlaceholder.

## 🚀 Funcionalidades

- Listagem de concursos abertos
- Consumo de dados via API
- Feedback visual de carregamento e erros

## 🛠️ Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript
- [JSONPlaceholder API](https://jsonplaceholder.typicode.com/)

## Documentação da API
A JSONPlaceholder é uma API REST fake e gratuita utilizada para testes, prototipação e aprendizado de consumo de APIs HTTP.

Ela simula um backend real e permite realizar operações como:

- buscar dados (GET);
- criar registros (POST);
- atualizar dados (PUT e PATCH);
- remover informações (DELETE).

A API não precisa de autenticação.

Método	Endpoint	    Função
- GET	    /concursos	  Lista todos os concursos
- GET	    /concurso/:id	Busca um concurso específico
- POST	  /concurso	    Cria um novo concurso
- PUT	    /concurso/:id	Atualiza um concurso inteiro
- PATCH	  /concurso/:id	Atualiza parcialmente
- DELETE	/concurso/:id	Remove um concurso

Como futuros contribuidores devem interagir:
- Utilizar base URL oficial: https://jsonplaceholder.typicode.com/
- É recomendado criar um arquivo para comunicação com a API:
  
<img width="672" height="355" alt="image" src="https://github.com/user-attachments/assets/c9ebc0f3-0587-4d69-8193-651fdddc5618" />


## Instruções de como executar o projeto localmente

- git clone https://github.com/E-Danillo/cc-projeto-concursos.git
- cd cc-projeto-concursos
- code .
- No VS Code:
    - Clique na aba Extensions;
    - Pesquise por Live Server;
    - Instale a extensão criada por Ritwick Dey.
- Abra o arquivo principal do projeto (login.html);
    - Clique com o botão direito no arquivo;
    - Selecione "Open with Live Server".

O navegador abrirá automaticamente com o projeto em execução (http://127.0.0.1:5500/html/login.html) 

Sempre execute o projeto pelo login.html;

O Live Server atualiza automaticamente a página ao salvar alterações;

Caso a porta esteja ocupada, o Live Server utilizará outra automaticamente.

## Instruções recomendadas de fluxo
- Atualizar o projeto: git pull origin main
- Criar branch de alteração : git checkout -b feature/nome-da-feature
- Enviar alterações:
    - git add .
    - git commit -m "feat: descrição da alteração"
    - git push origin nome-da-branch

## 📸 Demonstração

![preview do projeto](preview.png)

## 📌 Objetivo do Projeto

Este projeto foi desenvolvido com o objetivo de praticar:

- Consumo de APIs com `fetch`
- Manipulação de DOM
- Tratamento de erros assíncronos com `try/catch`
- Estruturação de projetos front-end

## 👨‍💻 Autores

Desenvolvido por:
[E-Danillo](https://github.com/E-Danillo) 
[Gisele](https://github.com/Gisele0304)
[Ricardo](https://github.com/RicardoPCBrito)
[Gydeon](https://github.com/gydwxd)
[Neto](https://github.com/8qst6js4vv-commits)
