import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import './PrivacyPolicy.css';

const DEFAULT_CONTENT = `# Política de Privacidade

**Última atualização:** 11 de janeiro de 2025

## 1. Introdução

Bem-vindo ao AllInStock. Esta Política de Privacidade descreve como recolhemos, utilizamos, processamos e protegemos as suas informações pessoais quando utiliza a nossa aplicação de gestão empresarial (CRM).

Ao utilizar o AllInStock, você concorda com a recolha e utilização de informações de acordo com esta política. Comprometemo-nos a proteger a sua privacidade e a segurança dos seus dados.

## 2. Informações que Recolhemos

Recolhemos as seguintes categorias de informações:

- **Informações de Conta:** Nome, email, senha (encriptada) e informações de perfil da empresa.
- **Dados Empresariais:** Informações sobre produtos, stock, clientes, fornecedores, orçamentos e faturas que você introduz na aplicação.
- **Informações de Utilização:** Dados sobre como você utiliza a aplicação, incluindo funcionalidades acedidas e ações realizadas.
- **Informações Técnicas:** Endereço IP, tipo de dispositivo, sistema operativo, navegador e dados de diagnóstico.

## 3. Como Utilizamos as Suas Informações

Utilizamos as informações recolhidas para:

- Fornecer, manter e melhorar os nossos serviços
- Processar transações e gerir a sua conta
- Enviar notificações importantes sobre o serviço
- Responder às suas solicitações e fornecer suporte ao cliente
- Monitorizar e analisar tendências, utilização e atividades
- Detetar, prevenir e resolver problemas técnicos ou de segurança
- Personalizar e melhorar a sua experiência

## 4. Partilha de Informações

Não vendemos, alugamos ou partilhamos as suas informações pessoais com terceiros, exceto nas seguintes circunstâncias:

- **Prestadores de Serviços:** Partilhamos informações com fornecedores que nos ajudam a operar a aplicação (ex: Firebase para armazenamento de dados).
- **Requisitos Legais:** Quando exigido por lei ou para proteger os nossos direitos legais.
- **Com o Seu Consentimento:** Quando você nos autoriza explicitamente a partilhar informações.

## 5. Segurança dos Dados

Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger as suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Estas medidas incluem:

- Encriptação de dados em trânsito e em repouso
- Autenticação segura via Firebase Authentication
- Controlo de acesso baseado em permissões
- Monitorização regular de segurança
- Backups regulares dos dados

## 6. Armazenamento de Dados

Os seus dados são armazenados de forma segura nos servidores do Firebase (Google Cloud Platform) localizados na Europa. Mantemos os seus dados pelo tempo necessário para fornecer os nossos serviços ou conforme exigido por lei.

## 7. Os Seus Direitos

De acordo com o RGPD (Regulamento Geral sobre a Proteção de Dados), você tem os seguintes direitos:

- **Acesso:** Solicitar acesso aos seus dados pessoais
- **Retificação:** Corrigir dados imprecisos ou incompletos
- **Eliminação:** Solicitar a eliminação dos seus dados
- **Portabilidade:** Receber os seus dados num formato estruturado
- **Oposição:** Opor-se ao processamento dos seus dados
- **Restrição:** Solicitar a restrição do processamento

## 8. Cookies e Tecnologias Semelhantes

Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência, analisar tendências e administrar a aplicação. Você pode controlar o uso de cookies através das configurações do seu navegador.

## 9. Serviços de Terceiros

A nossa aplicação utiliza os seguintes serviços de terceiros:

- **Firebase (Google):** Autenticação, base de dados e armazenamento
- **Eupago:** Processamento de pagamentos

Estes serviços têm as suas próprias políticas de privacidade que regulam a utilização de informações.

## 10. Proteção de Menores

Os nossos serviços não se destinam a menores de 18 anos. Não recolhemos conscientemente informações pessoais de menores. Se tomarmos conhecimento de que recolhemos dados de um menor, tomaremos medidas para eliminar essas informações.

## 11. Alterações a Esta Política

Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre quaisquer alterações publicando a nova política nesta página e atualizando a data de "Última atualização". Recomendamos que reveja esta política regularmente.

## 12. Transferências Internacionais de Dados

Os seus dados podem ser transferidos e armazenados em servidores localizados fora do seu país de residência. Garantimos que estas transferências cumprem as leis de proteção de dados aplicáveis.

## 13. Contacte-nos

Se tiver questões sobre esta Política de Privacidade ou sobre as nossas práticas de privacidade, contacte-nos:

**Email:** joaquim.oliveira@one.pt
**Website:** https://allinstock.pt
**Morada:** Rua Poça do Pisão Nº265, Vila Nova de Famalicão 4760-131, Portugal
`;

export default function PrivacyPolicy() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrivacyPolicy();
  }, []);

  const loadPrivacyPolicy = async () => {
    try {
      const docRef = doc(db, 'settings', 'privacyPolicy');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setContent(docSnap.data().content || DEFAULT_CONTENT);
      } else {
        setContent(DEFAULT_CONTENT);
      }
    } catch (error) {
      console.error('Error loading privacy policy:', error);
      setContent(DEFAULT_CONTENT);
    } finally {
      setLoading(false);
    }
  };

  const convertMarkdownToHtml = (markdown) => {
    let html = markdown;

    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Paragraphs and lists
    const lines = html.split('\n');
    const processedLines = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('<h')) {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      } else if (line.startsWith('- ')) {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        processedLines.push(`<li>${line.substring(2)}</li>`);
      } else if (line === '') {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
      } else if (!line.startsWith('<')) {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(`<p>${line}</p>`);
      } else {
        processedLines.push(line);
      }
    }

    if (inList) {
      processedLines.push('</ul>');
    }

    return processedLines.join('\n');
  };

  if (loading) {
    return (
      <div className="privacy-policy-wrapper">
        <div className="privacy-policy-container">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="privacy-policy-wrapper">
      <div className="privacy-policy-container">
        <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(content) }} />
        <a href="/" className="back-link">← Voltar ao AllInStock</a>
      </div>
    </div>
  );
}
