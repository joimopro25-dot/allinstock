import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Sidebar } from '../../components/common/Sidebar';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { emailService } from '../../services/emailService';
import { gmailIntegration } from '../../services/gmailIntegration';
import {
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import './EmailHub.css';

export function EmailHub() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [emailConfig, setEmailConfig] = useState(null);
  const [connectedUser, setConnectedUser] = useState(null);
  const [syncStats, setSyncStats] = useState(null);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const { company, signOut } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (company?.id) {
      loadEmailConfig();
      loadSyncStats();
    }
  }, [company]);

  const loadEmailConfig = async () => {
    try {
      setLoading(true);
      const config = await emailService.getEmailConfig(company.id);
      setEmailConfig(config);

      if (config && config.provider === 'gmail') {
        // Try to restore Gmail connection with saved token
        try {
          await gmailIntegration.initialize();

          // Restore access token if available
          if (config.accessToken) {
            await gmailIntegration.restoreToken(config.accessToken, config.email);
            const user = gmailIntegration.getCurrentUser();
            setConnectedUser(user);
          } else {
            setConnectedUser(null);
          }
        } catch (err) {
          console.log('Gmail not connected:', err);
          setConnectedUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStats = async () => {
    try {
      const stats = await emailService.getSyncStats(company.id);
      setSyncStats(stats);
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setLoading(true);
      const user = await gmailIntegration.signIn();
      setConnectedUser(user);

      // Save configuration with access token for persistent connection
      const accessToken = gmailIntegration.accessToken;
      await emailService.saveEmailConfig(company.id, {
        provider: 'gmail',
        email: user.email,
        accessToken: accessToken, // Store token to stay connected
        connectedAt: new Date().toISOString()
      });

      await loadEmailConfig();
      alert(language === 'pt' ? 'Gmail conectado com sucesso!' : 'Gmail connected successfully!');
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));

      // Extract detailed error information
      let errorMsg = 'Unknown error';
      if (error.error) {
        errorMsg = error.error;
      } else if (error.details) {
        errorMsg = error.details;
      } else if (error.message) {
        errorMsg = error.message;
      }

      // Log additional context
      console.log('Error type:', typeof error);
      console.log('Error keys:', Object.keys(error));

      alert(
        language === 'pt'
          ? `Erro ao conectar Gmail: ${errorMsg}\n\nVerifique o console para mais detalhes.`
          : `Error connecting Gmail: ${errorMsg}\n\nCheck console for more details.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = confirm(
      language === 'pt'
        ? 'Tem certeza que deseja desconectar o email?'
        : 'Are you sure you want to disconnect email?'
    );

    if (!confirmed) return;

    try {
      await gmailIntegration.signOut();
      if (emailConfig?.id) {
        await emailService.deleteEmailConfig(company.id, emailConfig.id);
      }
      setConnectedUser(null);
      setEmailConfig(null);
      alert(language === 'pt' ? 'Email desconectado' : 'Email disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert(language === 'pt' ? 'Erro ao desconectar' : 'Error disconnecting');
    }
  };

  const handleSyncEmails = async () => {
    try {
      setSyncing(true);
      setSyncProgress({ current: 0, total: 0 });

      // Fetch emails from Gmail
      const { emails } = await gmailIntegration.fetchEmails(200);

      setSyncProgress({ current: 0, total: emails.length });

      // Get contact mapping
      const contactMap = await emailService.matchEmailsToContacts(company.id);

      // Save each email with contact matching
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];

        // Match sender
        const fromContact = contactMap.get(email.from.toLowerCase());

        // Match recipients
        const toContacts = email.to
          .map(addr => contactMap.get(addr.toLowerCase()))
          .filter(c => c);

        const primaryContact = fromContact || (toContacts.length > 0 ? toContacts[0] : null);

        await emailService.saveEmail(company.id, {
          ...email,
          contactId: primaryContact?.id || null,
          contactName: primaryContact?.name || null,
          contactType: primaryContact?.type || null
        });

        setSyncProgress({ current: i + 1, total: emails.length });
      }

      await loadSyncStats();
      alert(
        language === 'pt'
          ? `${emails.length} emails sincronizados com sucesso!`
          : `${emails.length} emails synced successfully!`
      );
    } catch (error) {
      console.error('Error syncing emails:', error);
      alert(language === 'pt' ? 'Erro ao sincronizar emails' : 'Error syncing emails');
    } finally {
      setSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className={`email-hub-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="email-hub-header">
          <div className="header-left">
            <h1 className="logo-text" onClick={() => navigate('/dashboard')}>
              AllInStock
            </h1>
            <h2 className="page-title">
              {language === 'pt' ? 'Central de Email' : 'Email Hub'}
            </h2>
          </div>

          <div className="header-right">
            <LanguageToggle />
            <button className="logout-button" onClick={handleLogout}>
              {language === 'pt' ? 'Sair' : 'Logout'}
            </button>
          </div>
        </div>

        <div className="email-hub-content">
          {loading ? (
            <div className="loading">{language === 'pt' ? 'A carregar...' : 'Loading...'}</div>
          ) : (
            <>
              {/* Connection Status */}
              <div className="connection-section">
                <h3 className="section-title">
                  {language === 'pt' ? 'Conexão de Email' : 'Email Connection'}
                </h3>

                {!connectedUser ? (
                  <div className="connect-card">
                    <EnvelopeIcon className="connect-icon" />
                    <h4>{language === 'pt' ? 'Conectar Conta de Email' : 'Connect Email Account'}</h4>
                    <p className="connect-description">
                      {language === 'pt'
                        ? 'Conecte sua conta Gmail para sincronizar emails com clientes e fornecedores automaticamente.'
                        : 'Connect your Gmail account to sync emails with clients and suppliers automatically.'}
                    </p>
                    <button className="connect-button" onClick={handleConnectGmail}>
                      {language === 'pt' ? 'Conectar Gmail' : 'Connect Gmail'}
                    </button>
                  </div>
                ) : (
                  <div className="connected-card">
                    <div className="connected-header">
                      <div className="user-info">
                        {connectedUser.imageUrl && (
                          <img src={connectedUser.imageUrl} alt={connectedUser.name} className="user-avatar" />
                        )}
                        <div>
                          <h4 className="user-name">{connectedUser.name}</h4>
                          <p className="user-email">{connectedUser.email}</p>
                        </div>
                      </div>
                      <div className="status-badge connected">
                        <CheckCircleIcon className="status-icon" />
                        {language === 'pt' ? 'Conectado' : 'Connected'}
                      </div>
                    </div>

                    <div className="connected-actions">
                      <button
                        className="sync-button"
                        onClick={handleSyncEmails}
                        disabled={syncing}
                      >
                        <ArrowPathIcon className={`sync-icon ${syncing ? 'spinning' : ''}`} />
                        {syncing
                          ? language === 'pt'
                            ? 'A Sincronizar...'
                            : 'Syncing...'
                          : language === 'pt'
                          ? 'Sincronizar Emails'
                          : 'Sync Emails'}
                      </button>

                      <button className="disconnect-button" onClick={handleDisconnect}>
                        <XCircleIcon className="disconnect-icon" />
                        {language === 'pt' ? 'Desconectar' : 'Disconnect'}
                      </button>
                    </div>

                    {syncing && syncProgress.total > 0 && (
                      <div className="sync-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                          />
                        </div>
                        <p className="progress-text">
                          {syncProgress.current} / {syncProgress.total} emails
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Statistics */}
              {syncStats && syncStats.totalEmails > 0 && (
                <div className="stats-section">
                  <h3 className="section-title">
                    {language === 'pt' ? 'Estatísticas' : 'Statistics'}
                  </h3>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <EnvelopeIcon className="stat-icon total" />
                      <div className="stat-content">
                        <p className="stat-label">{language === 'pt' ? 'Total de Emails' : 'Total Emails'}</p>
                        <p className="stat-value">{syncStats.totalEmails}</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <UserGroupIcon className="stat-icon clients" />
                      <div className="stat-content">
                        <p className="stat-label">{language === 'pt' ? 'Emails de Clientes' : 'Client Emails'}</p>
                        <p className="stat-value">{syncStats.clientEmails}</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <BuildingStorefrontIcon className="stat-icon suppliers" />
                      <div className="stat-content">
                        <p className="stat-label">
                          {language === 'pt' ? 'Emails de Fornecedores' : 'Supplier Emails'}
                        </p>
                        <p className="stat-value">{syncStats.supplierEmails}</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <ChartBarIcon className="stat-icon unmatched" />
                      <div className="stat-content">
                        <p className="stat-label">{language === 'pt' ? 'Não Associados' : 'Unmatched'}</p>
                        <p className="stat-value">{syncStats.unmatchedEmails}</p>
                      </div>
                    </div>
                  </div>

                  {syncStats.lastSyncDate && (
                    <p className="last-sync">
                      {language === 'pt' ? 'Última sincronização: ' : 'Last sync: '}
                      {new Date(syncStats.lastSyncDate).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="instructions-section">
                <h3 className="section-title">
                  {language === 'pt' ? 'Como Funciona' : 'How It Works'}
                </h3>
                <div className="instructions">
                  <div className="instruction-item">
                    <div className="instruction-number">1</div>
                    <div className="instruction-content">
                      <h4>{language === 'pt' ? 'Conectar Email' : 'Connect Email'}</h4>
                      <p>
                        {language === 'pt'
                          ? 'Conecte sua conta Gmail para autorizar o acesso aos seus emails.'
                          : 'Connect your Gmail account to authorize access to your emails.'}
                      </p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <div className="instruction-number">2</div>
                    <div className="instruction-content">
                      <h4>{language === 'pt' ? 'Sincronizar' : 'Sync'}</h4>
                      <p>
                        {language === 'pt'
                          ? 'Clique em "Sincronizar Emails" para importar seus emails recentes.'
                          : 'Click "Sync Emails" to import your recent emails.'}
                      </p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <div className="instruction-number">3</div>
                    <div className="instruction-content">
                      <h4>{language === 'pt' ? 'Associação Automática' : 'Auto-Match'}</h4>
                      <p>
                        {language === 'pt'
                          ? 'Os emails serão automaticamente associados aos seus clientes e fornecedores pelo endereço de email.'
                          : 'Emails will be automatically matched to your clients and suppliers by email address.'}
                      </p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <div className="instruction-number">4</div>
                    <div className="instruction-content">
                      <h4>{language === 'pt' ? 'Ver Histórico' : 'View History'}</h4>
                      <p>
                        {language === 'pt'
                          ? 'Acesse os detalhes de cada cliente ou fornecedor para ver todo o histórico de emails.'
                          : 'Access each client or supplier detail page to see their full email history.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
