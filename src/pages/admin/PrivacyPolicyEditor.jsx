import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { DocumentTextIcon, CheckIcon, EyeIcon } from '@heroicons/react/24/outline';

const DEFAULT_PRIVACY_POLICY = `# Política de Privacidade

**Última atualização:** ${new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}

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

export default function PrivacyPolicyEditor({ onBack }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadPrivacyPolicy();
  }, []);

  const loadPrivacyPolicy = async () => {
    try {
      const docRef = doc(db, 'settings', 'privacyPolicy');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setContent(data.content || DEFAULT_PRIVACY_POLICY);
        setLastSaved(data.updatedAt?.toDate());
      } else {
        setContent(DEFAULT_PRIVACY_POLICY);
      }
    } catch (error) {
      console.error('Error loading privacy policy:', error);
      setContent(DEFAULT_PRIVACY_POLICY);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await setDoc(doc(db, 'settings', 'privacyPolicy'), {
        content,
        updatedAt: Timestamp.now()
      }, { merge: true });

      setLastSaved(new Date());
      alert('Privacy Policy saved successfully!');
    } catch (error) {
      console.error('Error saving privacy policy:', error);
      alert('Failed to save privacy policy. Please try again.');
    } finally {
      setSaving(false);
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

    // Paragraphs
    html = html.split('\n\n').map(para => {
      if (!para.startsWith('<h') && !para.startsWith('- ')) {
        return `<p>${para}</p>`;
      }
      return para;
    }).join('\n');

    // Lists
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    return html;
  };

  if (loading) {
    return (
      <div className="view-container">
        <div style={{ padding: '4rem', textAlign: 'center', color: 'white' }}>
          <DocumentTextIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }} />
          <h2>Loading Privacy Policy...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <button className="btn-back" onClick={onBack}>
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white' }}>Privacy Policy Editor</h2>
          {lastSaved && (
            <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              Last saved: {lastSaved.toLocaleString('pt-PT')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600'
            }}
          >
            <EyeIcon style={{ width: '20px', height: '20px' }} />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              opacity: saving ? 0.6 : 1
            }}
          >
            <CheckIcon style={{ width: '20px', height: '20px' }} />
            {saving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>
              Content (Markdown)
            </label>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              {content.length} characters
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
            Edit the privacy policy content below. Use Markdown formatting (# for headers, ** for bold, - for lists).
          </p>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: '600px',
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '0.95rem',
            fontFamily: 'monospace',
            lineHeight: '1.6',
            resize: 'vertical'
          }}
          placeholder="Enter privacy policy content..."
        />
      </div>

      {showPreview && (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '3rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ color: '#667eea', marginBottom: '1rem' }}>Preview</h2>
          <div
            style={{
              color: '#333',
              lineHeight: '1.8'
            }}
            dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(content) }}
          />
        </div>
      )}

      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <h3 style={{ color: '#10b981', margin: '0 0 1rem 0' }}>How it works</h3>
        <ul style={{ color: 'rgba(255,255,255,0.8)', margin: 0, paddingLeft: '1.5rem' }}>
          <li>Edit the content using Markdown formatting</li>
          <li>Click "Show Preview" to see how it will look</li>
          <li>Click "Save & Publish" to update the privacy policy in Firestore</li>
          <li>The privacy policy will be automatically displayed at <code>/privacy-policy</code></li>
          <li>Users will see the updated version immediately after saving</li>
        </ul>
      </div>
    </div>
  );
}
