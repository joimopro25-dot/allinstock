import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { emailService } from '../../services/emailService';
import { gmailIntegration } from '../../services/gmailIntegration';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  EnvelopeOpenIcon
} from '@heroicons/react/24/outline';
import './EmailsTab.css';

export function EmailsTab({ contact }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [composeData, setComposeData] = useState({
    to: contact.email || '',
    subject: '',
    body: ''
  });

  const { company } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    checkGmailConnection();
    if (contact.email) {
      loadEmails();
    }
  }, [contact]);

  const checkGmailConnection = async () => {
    try {
      const config = await emailService.getEmailConfig(company.id);
      if (config && config.accessToken) {
        // Restore Gmail connection
        await gmailIntegration.restoreToken(config.accessToken, config.email);
        setIsGmailConnected(true);
      } else {
        setIsGmailConnected(false);
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      setIsGmailConnected(false);
    }
  };

  const loadEmails = async () => {
    try {
      setLoading(true);
      const contactEmails = await emailService.getContactEmails(company.id, contact.email);
      setEmails(contactEmails);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncEmails = async () => {
    if (!isGmailConnected) {
      alert(
        language === 'pt'
          ? 'Por favor, conecte o Gmail primeiro na Central de Email'
          : 'Please connect Gmail first in Email Hub'
      );
      return;
    }

    try {
      setSyncing(true);

      // Fetch latest emails from Gmail
      const { emails: newEmails } = await gmailIntegration.fetchEmails(50);

      // Get contact mapping
      const contactMap = await emailService.matchEmailsToContacts(company.id);

      // Filter and save emails for this specific contact
      let syncedCount = 0;
      for (const email of newEmails) {
        // Check if email involves this contact
        const fromContact = contactMap.get(email.from.toLowerCase());
        const toContacts = email.to.map(addr => contactMap.get(addr.toLowerCase())).filter(c => c);

        if (
          (fromContact?.id === contact.id) ||
          toContacts.some(c => c?.id === contact.id)
        ) {
          const primaryContact = fromContact || toContacts[0];
          await emailService.saveEmail(company.id, {
            ...email,
            contactId: primaryContact?.id || null,
            contactName: primaryContact?.name || null,
            contactType: primaryContact?.type || null
          });
          syncedCount++;
        }
      }

      await loadEmails();
      alert(
        language === 'pt'
          ? `${syncedCount} novos emails sincronizados!`
          : `${syncedCount} new emails synced!`
      );
    } catch (error) {
      console.error('Error syncing emails:', error);
      alert(language === 'pt' ? 'Erro ao sincronizar emails' : 'Error syncing emails');
    } finally {
      setSyncing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!isGmailConnected) {
      alert(
        language === 'pt'
          ? 'Por favor, conecte o Gmail primeiro na Central de Email'
          : 'Please connect Gmail first in Email Hub'
      );
      return;
    }

    try {
      if (!composeData.subject || !composeData.body) {
        alert(language === 'pt' ? 'Preencha assunto e mensagem' : 'Fill in subject and message');
        return;
      }

      await gmailIntegration.sendEmail({
        to: composeData.to,
        subject: composeData.subject,
        body: composeData.body
      });

      alert(language === 'pt' ? 'Email enviado!' : 'Email sent!');

      // Reset compose form
      setComposeData({
        to: contact.email || '',
        subject: '',
        body: ''
      });
      setShowCompose(false);

      // Refresh emails
      setTimeout(() => handleSyncEmails(), 2000);
    } catch (error) {
      console.error('Error sending email:', error);
      alert(language === 'pt' ? 'Erro ao enviar email' : 'Error sending email');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString(language === 'pt' ? 'pt-PT' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // Less than 7 days
      return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (!contact.email) {
    return (
      <div className="emails-tab-empty">
        <EnvelopeIcon className="empty-icon" />
        <p>{language === 'pt' ? 'Nenhum email configurado para este contacto' : 'No email configured for this contact'}</p>
        <p className="empty-hint">
          {language === 'pt'
            ? 'Adicione um email ao contacto para ver o histórico de emails.'
            : 'Add an email to the contact to see email history.'}
        </p>
      </div>
    );
  }

  return (
    <div className="emails-tab">
      {!isGmailConnected && (
        <div className="gmail-not-connected-banner">
          <EnvelopeIcon className="banner-icon" />
          <div className="banner-content">
            <p className="banner-title">
              {language === 'pt' ? 'Gmail não conectado' : 'Gmail not connected'}
            </p>
            <p className="banner-text">
              {language === 'pt'
                ? 'Vá para a Central de Email para conectar sua conta Gmail e sincronizar emails.'
                : 'Go to Email Hub to connect your Gmail account and sync emails.'}
            </p>
          </div>
          <button
            className="banner-button"
            onClick={() => window.location.href = '/email-hub'}
          >
            {language === 'pt' ? 'Ir para Central de Email' : 'Go to Email Hub'}
          </button>
        </div>
      )}

      <div className="emails-tab-header">
        <div className="header-left">
          <h3>{language === 'pt' ? 'Emails' : 'Emails'}</h3>
          <span className="email-count">{emails.length}</span>
        </div>

        <div className="header-actions">
          <button
            className="sync-button"
            onClick={handleSyncEmails}
            disabled={syncing || !isGmailConnected}
          >
            <ArrowPathIcon className={`icon ${syncing ? 'spinning' : ''}`} />
            {syncing
              ? (language === 'pt' ? 'A sincronizar...' : 'Syncing...')
              : (language === 'pt' ? 'Sincronizar' : 'Sync')}
          </button>

          <button
            className="compose-button"
            onClick={() => setShowCompose(!showCompose)}
            disabled={!isGmailConnected}
          >
            <PaperAirplaneIcon className="icon" />
            {language === 'pt' ? 'Novo Email' : 'New Email'}
          </button>
        </div>
      </div>

      {/* Compose Email Form */}
      {showCompose && (
        <div className="compose-email">
          <div className="compose-header">
            <h4>{language === 'pt' ? 'Novo Email' : 'New Email'}</h4>
            <button className="close-button" onClick={() => setShowCompose(false)}>×</button>
          </div>

          <div className="compose-form">
            <div className="form-field">
              <label>{language === 'pt' ? 'Para' : 'To'}</label>
              <input
                type="email"
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                placeholder={contact.email}
              />
            </div>

            <div className="form-field">
              <label>{language === 'pt' ? 'Assunto' : 'Subject'}</label>
              <input
                type="text"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder={language === 'pt' ? 'Assunto do email' : 'Email subject'}
              />
            </div>

            <div className="form-field">
              <label>{language === 'pt' ? 'Mensagem' : 'Message'}</label>
              <textarea
                value={composeData.body}
                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                placeholder={language === 'pt' ? 'Escreva a sua mensagem...' : 'Write your message...'}
                rows={10}
              />
            </div>

            <div className="compose-actions">
              <button className="cancel-button" onClick={() => setShowCompose(false)}>
                {language === 'pt' ? 'Cancelar' : 'Cancel'}
              </button>
              <button className="send-button" onClick={handleSendEmail}>
                <PaperAirplaneIcon className="icon" />
                {language === 'pt' ? 'Enviar' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email List */}
      {loading ? (
        <div className="loading">{language === 'pt' ? 'A carregar...' : 'Loading...'}</div>
      ) : emails.length === 0 ? (
        <div className="emails-empty">
          <EnvelopeIcon className="empty-icon" />
          <p>{language === 'pt' ? 'Nenhum email encontrado' : 'No emails found'}</p>
          <p className="empty-hint">
            {language === 'pt'
              ? 'Clique em "Sincronizar" para importar emails do Gmail'
              : 'Click "Sync" to import emails from Gmail'}
          </p>
        </div>
      ) : (
        <div className="emails-list">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`email-item ${selectedEmail?.id === email.id ? 'selected' : ''}`}
              onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}
            >
              <div className="email-item-header">
                <div className="email-from">
                  {email.from === contact.email ? (
                    <>
                      <EnvelopeOpenIcon className="direction-icon received" />
                      <span className="from-name">{email.fromName || email.from}</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="direction-icon sent" />
                      <span className="from-name">{language === 'pt' ? 'Você' : 'You'}</span>
                    </>
                  )}
                </div>
                <div className="email-date">{formatDate(email.date)}</div>
              </div>

              <div className="email-subject">{email.subject || (language === 'pt' ? '(sem assunto)' : '(no subject)')}</div>

              <div className="email-snippet">{email.snippet || email.body?.substring(0, 100)}</div>

              {selectedEmail?.id === email.id && (
                <div className="email-body">
                  <div className="email-details">
                    <div className="detail-row">
                      <strong>{language === 'pt' ? 'De:' : 'From:'}</strong>
                      <span>{email.fromName ? `${email.fromName} <${email.from}>` : email.from}</span>
                    </div>
                    <div className="detail-row">
                      <strong>{language === 'pt' ? 'Para:' : 'To:'}</strong>
                      <span>{email.to.join(', ')}</span>
                    </div>
                    {email.cc && email.cc.length > 0 && (
                      <div className="detail-row">
                        <strong>Cc:</strong>
                        <span>{email.cc.join(', ')}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <strong>{language === 'pt' ? 'Data:' : 'Date:'}</strong>
                      <span>{new Date(email.date).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')}</span>
                    </div>
                  </div>
                  <div className="email-content">
                    {email.body}
                  </div>
                  <div className="email-actions">
                    <button
                      className="reply-button"
                      onClick={() => {
                        setComposeData({
                          to: email.from,
                          subject: `Re: ${email.subject}`,
                          body: `\n\n--- ${language === 'pt' ? 'Email original' : 'Original email'} ---\n${email.body}`
                        });
                        setShowCompose(true);
                        setSelectedEmail(null);
                      }}
                    >
                      {language === 'pt' ? 'Responder' : 'Reply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
