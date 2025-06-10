// =====================================================
// SISTEMA DE LOGGING
// =====================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

export class Logger {
  private component: string;
  private static globalLevel: LogLevel = LogLevel.INFO;
  private static logs: LogEntry[] = [];
  private static maxLogs: number = 1000;

  constructor(component: string) {
    this.component = component;
  }

  static setLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }

  static setMaxLogs(max: number): void {
    Logger.maxLogs = max;
  }

  static getLogs(component?: string, level?: LogLevel): LogEntry[] {
    let filteredLogs = Logger.logs;

    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component);
    }

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    return filteredLogs.slice(-100); // Últimos 100 logs
  }

  static clearLogs(): void {
    Logger.logs = [];
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: any): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.ERROR, message, undefined, errorObj);
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (level < Logger.globalLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component: this.component,
      message,
      data,
      error,
    };

    // Adicionar ao array de logs
    Logger.logs.push(entry);

    // Manter apenas os últimos N logs
    if (Logger.logs.length > Logger.maxLogs) {
      Logger.logs = Logger.logs.slice(-Logger.maxLogs);
    }

    // Output para console
    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}] [${entry.component}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}`, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}`);
        if (entry.error) {
          console.error(entry.error.stack || entry.error.message);
        }
        if (entry.data) {
          console.error('Data:', entry.data);
        }
        break;
    }
  }

  // Métodos de conveniência para logging estruturado
  logOperation(operation: string, data?: any): void {
    this.info(`Operation: ${operation}`, data);
  }

  logPerformance(operation: string, startTime: number, data?: any): void {
    const duration = Date.now() - startTime;
    this.info(`Performance: ${operation} completed in ${duration}ms`, data);
  }

  logApiCall(method: string, url: string, statusCode?: number, duration?: number): void {
    const message = `API ${method} ${url}`;
    const data = { statusCode, duration };
    
    if (statusCode && statusCode >= 400) {
      this.warn(message, data);
    } else {
      this.info(message, data);
    }
  }

  logDatabaseOperation(operation: string, table: string, duration?: number, rowsAffected?: number): void {
    const message = `DB ${operation} on ${table}`;
    const data = { duration, rowsAffected };
    this.debug(message, data);
  }

  logUserAction(userId: string, action: string, data?: any): void {
    this.info(`User ${userId}: ${action}`, data);
  }

  logAgentAnalysis(agent: string, description: string, confidence: number): void {
    this.info(`Agent ${agent} analyzed: ${description} (confidence: ${confidence})`, {
      agent,
      confidence,
    });
  }

  logCommandExecution(command: string, projectId: string, success: boolean, duration?: number): void {
    const message = `Command ${command} for project ${projectId}`;
    const data = { success, duration };
    
    if (success) {
      this.info(message, data);
    } else {
      this.warn(message, data);
    }
  }

  // Métodos para criar loggers filhos
  child(subComponent: string): Logger {
    return new Logger(`${this.component}.${subComponent}`);
  }

  // Métodos estáticos para logging global
  static debug(message: string, data?: any): void {
    new Logger('Global').debug(message, data);
  }

  static info(message: string, data?: any): void {
    new Logger('Global').info(message, data);
  }

  static warn(message: string, data?: any): void {
    new Logger('Global').warn(message, data);
  }

  static error(message: string, error?: any): void {
    new Logger('Global').error(message, error);
  }
}

// =====================================================
// CONFIGURAÇÃO INICIAL DO LOGGER
// =====================================================

// Configurar nível baseado na variável de ambiente
const logLevelEnv = process.env['LOG_LEVEL']?.toUpperCase();
switch (logLevelEnv) {
  case 'DEBUG':
    Logger.setLevel(LogLevel.DEBUG);
    break;
  case 'INFO':
    Logger.setLevel(LogLevel.INFO);
    break;
  case 'WARN':
    Logger.setLevel(LogLevel.WARN);
    break;
  case 'ERROR':
    Logger.setLevel(LogLevel.ERROR);
    break;
  default:
    // Desenvolvimento: DEBUG, Produção: INFO
    Logger.setLevel(process.env['NODE_ENV'] === 'production' ? LogLevel.INFO : LogLevel.DEBUG);

}

// Configurar máximo de logs baseado na variável de ambiente
const maxLogsEnv = process.env['MAX_LOGS'];
if (maxLogsEnv && !isNaN(parseInt(maxLogsEnv))) {
  Logger.setMaxLogs(parseInt(maxLogsEnv));
}

// =====================================================
// UTILITÁRIOS DE LOGGING
// =====================================================

export function createPerformanceLogger(component: string) {
  const logger = new Logger(component);
  
  return {
    start: (operation: string) => {
      const startTime = Date.now();
      logger.debug(`Starting: ${operation}`);
      
      return {
        end: (data?: any) => {
          const duration = Date.now() - startTime;
          logger.logPerformance(operation, startTime, data);
          return duration;
        }
      };
    }
  };
}

export function logAsyncOperation<T>(
  logger: Logger,
  operation: string,
  promise: Promise<T>
): Promise<T> {
  const startTime = Date.now();
  logger.debug(`Starting async operation: ${operation}`);
  
  return promise
    .then(result => {
      logger.logPerformance(operation, startTime);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      logger.error(`Failed async operation: ${operation} (${duration}ms)`, error);
      throw error;
    });
}

// =====================================================
// MIDDLEWARE DE LOGGING PARA EXPRESS (se necessário)
// =====================================================

export function createLoggingMiddleware(logger: Logger) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const { method, url, ip } = req;
    
    logger.info(`${method} ${url} from ${ip}`);
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.logApiCall(method, url, res.statusCode, duration);
    });
    
    next();
  };
}

export default Logger;

