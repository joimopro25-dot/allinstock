import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { calendarIntegration } from '../../services/calendarIntegration';
import {
  saveCalendarConfig,
  getCalendarConfig,
  deleteCalendarConfig,
  getEvents,
  saveEvent,
  deleteEvent as deleteEventFromFirestore,
  syncCRMEventsToGoogle
} from '../../services/calendarService';
import { Sidebar } from '../../components/common/Sidebar';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ArrowPathIcon,
  CloudIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import './Calendar.css';

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [events, setEvents] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUser, setConnectedUser] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    summary: '',
    description: '',
    start: '',
    end: '',
    location: '',
    attendees: ''
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTokenExpiredBanner, setShowTokenExpiredBanner] = useState(false);

  const { company } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    checkCalendarConnection();
    loadEvents();
  }, [company]);

  useEffect(() => {
    if (isConnected) {
      loadGoogleEvents();
    }
  }, [currentDate, isConnected]);

  const checkCalendarConnection = async () => {
    try {
      const config = await getCalendarConfig(company.id);
      if (config && config.accessToken) {
        // Try to restore the token
        try {
          await calendarIntegration.restoreToken(config.accessToken, config.email);

          // Verify token by making a test API call
          await calendarIntegration.fetchEvents(
            new Date().toISOString(),
            new Date(Date.now() + 1000).toISOString(), // 1 second range
            1 // Just 1 event
          );

          const user = calendarIntegration.getCurrentUser();
          setConnectedUser(user);
          setIsConnected(true);
        } catch (tokenError) {
          // Token is invalid/expired, clear it silently
          if (tokenError.status === 401) {
            await deleteCalendarConfig(company.id);
            setIsConnected(false);
            setConnectedUser(null);
          } else {
            throw tokenError;
          }
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      // Only log non-401 errors
      if (error.status !== 401) {
        console.error('Error checking calendar connection:', error);
      }
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      setLoading(true);
      const user = await calendarIntegration.signIn();
      const accessToken = calendarIntegration.accessToken;

      await saveCalendarConfig(company.id, {
        provider: 'google',
        email: user.email,
        accessToken: accessToken,
        connectedAt: new Date().toISOString()
      });

      setConnectedUser(user);
      setIsConnected(true);
      alert(language === 'pt' ? 'Google Calendar conectado!' : 'Google Calendar connected!');
    } catch (error) {
      console.error('Error connecting calendar:', error);
      alert(language === 'pt' ? 'Erro ao conectar calendário' : 'Error connecting calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await calendarIntegration.signOut();
      await deleteCalendarConfig(company.id);
      setConnectedUser(null);
      setIsConnected(false);
      setGoogleEvents([]);
      alert(language === 'pt' ? 'Google Calendar desconectado' : 'Google Calendar disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const firestoreEvents = await getEvents(
        company.id,
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      setEvents(firestoreEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadGoogleEvents = async () => {
    if (!isConnected) return;

    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const googleEvts = await calendarIntegration.fetchEvents(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      setGoogleEvents(googleEvts);
    } catch (error) {
      // Silently handle 401 errors (expired token)
      if (error.status === 401) {
        // Clear expired credentials without alerting
        await deleteCalendarConfig(company.id);
        setIsConnected(false);
        setConnectedUser(null);
        setGoogleEvents([]);
        setShowTokenExpiredBanner(true);

        // Auto-hide banner after 10 seconds
        setTimeout(() => setShowTokenExpiredBanner(false), 10000);
      } else {
        // Log other errors
        console.error('Error loading Google events:', error);
      }
    }
  };

  const handleSyncCRMEvents = async () => {
    if (!isConnected) {
      alert(
        language === 'pt'
          ? 'Por favor, conecte o Google Calendar primeiro'
          : 'Please connect Google Calendar first'
      );
      return;
    }

    try {
      setSyncing(true);
      const syncedEvents = await syncCRMEventsToGoogle(company.id, calendarIntegration);
      await loadEvents();
      await loadGoogleEvents();
      alert(
        language === 'pt'
          ? `${syncedEvents.length} eventos do CRM sincronizados!`
          : `${syncedEvents.length} CRM events synced!`
      );
    } catch (error) {
      console.error('Error syncing CRM events:', error);
      alert(language === 'pt' ? 'Erro ao sincronizar eventos' : 'Error syncing events');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!isConnected) {
      alert(
        language === 'pt'
          ? 'Por favor, conecte o Google Calendar primeiro'
          : 'Please connect Google Calendar first'
      );
      return;
    }

    try {
      if (!eventForm.summary || !eventForm.start || !eventForm.end) {
        alert(language === 'pt' ? 'Preencha título, início e fim' : 'Fill in title, start and end');
        return;
      }

      const attendees = eventForm.attendees
        ? eventForm.attendees.split(',').map(e => e.trim()).filter(e => e)
        : [];

      const googleEvent = await calendarIntegration.createEvent({
        summary: eventForm.summary,
        description: eventForm.description,
        start: new Date(eventForm.start).toISOString(),
        end: new Date(eventForm.end).toISOString(),
        location: eventForm.location,
        attendees
      });

      await saveEvent(company.id, {
        ...googleEvent,
        type: 'custom',
        color: '#3b82f6'
      });

      setEventForm({
        summary: '',
        description: '',
        start: '',
        end: '',
        location: '',
        attendees: ''
      });
      setShowEventModal(false);
      await loadEvents();
      await loadGoogleEvents();
      alert(language === 'pt' ? 'Evento criado!' : 'Event created!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert(language === 'pt' ? 'Erro ao criar evento' : 'Error creating event');
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!confirm(language === 'pt' ? 'Excluir este evento?' : 'Delete this event?')) {
      return;
    }

    try {
      if (event.googleEventId) {
        await calendarIntegration.deleteEvent(event.googleEventId);
      }
      await deleteEventFromFirestore(company.id, event.id);
      await loadEvents();
      await loadGoogleEvents();
      setSelectedEvent(null);
      alert(language === 'pt' ? 'Evento excluído!' : 'Event deleted!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(language === 'pt' ? 'Erro ao excluir evento' : 'Error deleting event');
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks = [];
    let currentWeek = [];

    // Fill empty cells before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Fill days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const isToday = dateString === new Date().toISOString().split('T')[0];

      // Get events for this day
      const dayEvents = [...events, ...googleEvents].filter(event => {
        const eventDate = new Date(event.start).toISOString().split('T')[0];
        return eventDate === dateString;
      });

      currentWeek.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''}`}
        >
          <div className="day-number">{day}</div>
          <div className="day-events">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={idx}
                className="day-event"
                style={{ backgroundColor: event.color || '#3b82f6' }}
                onClick={() => setSelectedEvent(event)}
                title={event.summary}
              >
                {event.summary}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="more-events">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );

      if (currentWeek.length === 7) {
        weeks.push(
          <div key={`week-${weeks.length}`} className="calendar-week">
            {currentWeek}
          </div>
        );
        currentWeek = [];
      }
    }

    // Fill remaining cells
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(
        <div key={`empty-end-${currentWeek.length}`} className="calendar-day empty"></div>
      );
    }
    if (currentWeek.length > 0) {
      weeks.push(
        <div key={`week-${weeks.length}`} className="calendar-week">
          {currentWeek}
        </div>
      );
    }

    return weeks;
  };

  if (loading) {
    return (
      <>
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <div className="calendar-page" style={{ marginLeft: sidebarCollapsed ? '80px' : '280px' }}>
          <div className="loading">{language === 'pt' ? 'A carregar...' : 'Loading...'}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="calendar-page" style={{ marginLeft: sidebarCollapsed ? '80px' : '280px' }}>
        <div className="calendar-layout">
        {/* Sidebar */}
        <div className="calendar-sidebar">
          {/* Mini Calendar */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Quick Jump</h3>
            <div className="mini-calendar">
              <div className="mini-month">{currentDate.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', { month: 'short', year: 'numeric' })}</div>
              <div className="mini-weekdays">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={idx} className="mini-weekday">{day}</div>
                ))}
              </div>
              <div className="mini-grid">
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                  const dayOffset = i - firstDay.getDay() + 1;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOffset);
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={i}
                      className={`mini-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'mini-today' : ''}`}
                      onClick={() => isCurrentMonth && setCurrentDate(date)}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Event Types Filter */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">{language === 'pt' ? 'Tipos de Eventos' : 'Event Types'}</h3>
            <div className="event-types">
              <div className="event-type-item">
                <div className="type-indicator delivery"></div>
                <span>{language === 'pt' ? 'Entregas' : 'Deliveries'}</span>
                <span className="type-count">{events.filter(e => e.type === 'delivery').length}</span>
              </div>
              <div className="event-type-item">
                <div className="type-indicator payment"></div>
                <span>{language === 'pt' ? 'Pagamentos' : 'Payments'}</span>
                <span className="type-count">{events.filter(e => e.type === 'payment').length}</span>
              </div>
              <div className="event-type-item">
                <div className="type-indicator alert"></div>
                <span>{language === 'pt' ? 'Alertas' : 'Alerts'}</span>
                <span className="type-count">{events.filter(e => e.type === 'alert').length}</span>
              </div>
              <div className="event-type-item">
                <div className="type-indicator custom"></div>
                <span>{language === 'pt' ? 'Personalizados' : 'Custom'}</span>
                <span className="type-count">{events.filter(e => e.type === 'custom').length}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">{language === 'pt' ? 'Estatísticas' : 'Statistics'}</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{events.length + googleEvents.length}</div>
                <div className="stat-label">{language === 'pt' ? 'Total Eventos' : 'Total Events'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{events.length}</div>
                <div className="stat-label">{language === 'pt' ? 'CRM' : 'CRM'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{googleEvents.length}</div>
                <div className="stat-label">{language === 'pt' ? 'Google' : 'Google'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="calendar-main">
      {/* Token Expired Banner */}
      {showTokenExpiredBanner && (
        <div className="token-expired-banner">
          <div className="banner-content">
            <span className="banner-icon">⚠️</span>
            <span className="banner-text">
              {language === 'pt'
                ? 'Sua sessão do Google Calendar expirou. Clique em "Conectar Google Calendar" para renovar.'
                : 'Your Google Calendar session expired. Click "Connect Google Calendar" to renew.'}
            </span>
            <button className="banner-close" onClick={() => setShowTokenExpiredBanner(false)}>×</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="calendar-header">
        <div className="header-left">
          <CalendarIcon style={{ width: '2rem', height: '2rem', color: 'var(--primary-color)' }} />
          <div>
            <h1>{language === 'pt' ? 'Calendário' : 'Calendar'}</h1>
            <p className="subtitle">
              {isConnected
                ? `${language === 'pt' ? 'Conectado a' : 'Connected to'}: ${connectedUser?.email}`
                : language === 'pt'
                ? 'Conecte o Google Calendar para sincronizar eventos'
                : 'Connect Google Calendar to sync events'}
            </p>
          </div>
        </div>

        <div className="header-actions">
          {!isConnected ? (
            <button className="connect-button" onClick={handleConnectCalendar}>
              <CloudIcon style={{ width: '1.25rem', height: '1.25rem' }} />
              {language === 'pt' ? 'Conectar Google Calendar' : 'Connect Google Calendar'}
            </button>
          ) : (
            <>
              <button className="sync-button" onClick={handleSyncCRMEvents} disabled={syncing}>
                <ArrowPathIcon
                  style={{ width: '1.25rem', height: '1.25rem' }}
                  className={syncing ? 'spinning' : ''}
                />
                {syncing
                  ? language === 'pt'
                    ? 'A sincronizar...'
                    : 'Syncing...'
                  : language === 'pt'
                  ? 'Sincronizar CRM'
                  : 'Sync CRM'}
              </button>
              <button className="create-button" onClick={() => setShowEventModal(true)}>
                <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                {language === 'pt' ? 'Novo Evento' : 'New Event'}
              </button>
              <button className="disconnect-button" onClick={handleDisconnect}>
                {language === 'pt' ? 'Desconectar' : 'Disconnect'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="calendar-navigation">
        <div className="nav-left">
          <button className="today-button" onClick={goToToday}>
            {language === 'pt' ? 'Hoje' : 'Today'}
          </button>
          <button className="nav-button" onClick={() => navigateMonth(-1)}>
            <ChevronLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
          <button className="nav-button" onClick={() => navigateMonth(1)}>
            <ChevronRightIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
          <h2 className="current-month">
            {currentDate.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </h2>
        </div>

        <div className="view-toggle">
          <button
            className={`view-button ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            {language === 'pt' ? 'Mês' : 'Month'}
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-container">
        <div className="calendar-weekdays">
          {(language === 'pt'
            ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          ).map(day => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-grid">{renderCalendar()}</div>
      </div>

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{language === 'pt' ? 'Novo Evento' : 'New Event'}</h3>
              <button className="close-button" onClick={() => setShowEventModal(false)}>
                <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-field">
                <label>{language === 'pt' ? 'Título' : 'Title'}</label>
                <input
                  type="text"
                  value={eventForm.summary}
                  onChange={e => setEventForm({ ...eventForm, summary: e.target.value })}
                  placeholder={language === 'pt' ? 'Título do evento' : 'Event title'}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>{language === 'pt' ? 'Início' : 'Start'}</label>
                  <input
                    type="datetime-local"
                    value={eventForm.start}
                    onChange={e => setEventForm({ ...eventForm, start: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>{language === 'pt' ? 'Fim' : 'End'}</label>
                  <input
                    type="datetime-local"
                    value={eventForm.end}
                    onChange={e => setEventForm({ ...eventForm, end: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>{language === 'pt' ? 'Local' : 'Location'}</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder={language === 'pt' ? 'Local do evento' : 'Event location'}
                />
              </div>

              <div className="form-field">
                <label>{language === 'pt' ? 'Descrição' : 'Description'}</label>
                <textarea
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder={language === 'pt' ? 'Descrição do evento' : 'Event description'}
                  rows={4}
                />
              </div>

              <div className="form-field">
                <label>{language === 'pt' ? 'Participantes (emails separados por vírgula)' : 'Attendees (comma-separated emails)'}</label>
                <input
                  type="text"
                  value={eventForm.attendees}
                  onChange={e => setEventForm({ ...eventForm, attendees: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowEventModal(false)}>
                {language === 'pt' ? 'Cancelar' : 'Cancel'}
              </button>
              <button className="create-event-button" onClick={handleCreateEvent}>
                {language === 'pt' ? 'Criar Evento' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content event-detail" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEvent.summary}</h3>
              <button className="close-button" onClick={() => setSelectedEvent(null)}>
                <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
            </div>

            <div className="modal-body">
              <div className="event-info">
                <p>
                  <strong>{language === 'pt' ? 'Início:' : 'Start:'}</strong>{' '}
                  {new Date(selectedEvent.start).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')}
                </p>
                <p>
                  <strong>{language === 'pt' ? 'Fim:' : 'End:'}</strong>{' '}
                  {new Date(selectedEvent.end).toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US')}
                </p>
                {selectedEvent.location && (
                  <p>
                    <strong>{language === 'pt' ? 'Local:' : 'Location:'}</strong> {selectedEvent.location}
                  </p>
                )}
                {selectedEvent.description && (
                  <p>
                    <strong>{language === 'pt' ? 'Descrição:' : 'Description:'}</strong>{' '}
                    {selectedEvent.description}
                  </p>
                )}
                {selectedEvent.type && (
                  <p>
                    <strong>{language === 'pt' ? 'Tipo:' : 'Type:'}</strong>{' '}
                    <span className={`event-type ${selectedEvent.type}`}>{selectedEvent.type}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {selectedEvent.type === 'custom' && (
                <button className="delete-button" onClick={() => handleDeleteEvent(selectedEvent)}>
                  {language === 'pt' ? 'Excluir' : 'Delete'}
                </button>
              )}
              {selectedEvent.htmlLink && (
                <a
                  href={selectedEvent.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-google-button"
                >
                  {language === 'pt' ? 'Ver no Google Calendar' : 'View in Google Calendar'}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
      </div>
    </>
  );
}
