import { createElement } from 'react';
import { CalculatorConfig } from '../../../types/calculator';
import CronPanel from './CronPanel';

const PRESETS: Record<string, { minute: string; hour: string; dom: string; month: string; dow: string; description: string }> = {
  'Every minute': { minute: '*', hour: '*', dom: '*', month: '*', dow: '*', description: 'Every minute' },
  'Every 5 minutes': { minute: '*/5', hour: '*', dom: '*', month: '*', dow: '*', description: 'Every 5 minutes' },
  'Every 15 minutes': { minute: '*/15', hour: '*', dom: '*', month: '*', dow: '*', description: 'Every 15 minutes' },
  'Every hour': { minute: '0', hour: '*', dom: '*', month: '*', dow: '*', description: 'Every hour' },
  'Daily at midnight': { minute: '0', hour: '0', dom: '*', month: '*', dow: '*', description: 'Daily at midnight' },
  'Weekly on Sunday': { minute: '0', hour: '0', dom: '*', month: '*', dow: '0', description: 'Weekly on Sunday' },
  'Monthly on 1st': { minute: '0', hour: '0', dom: '1', month: '*', dow: '*', description: 'Monthly on the 1st' },
};

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Shared by generateDescription() and generateNextRunDescription() — both
// append the same "on day X / in month Y / on day-of-week Z" suffix, only
// the minute/hour prefix phrasing differs between them.
function scheduleSuffixParts(dom: string, month: string, dow: string): string[] {
  const parts: string[] = [];

  if (dom !== '*' && dom !== '?') {
    if (/^\d+$/.test(dom)) {
      parts.push(`on day ${dom}`);
    } else {
      parts.push(`on days: ${dom}`);
    }
  }

  if (month !== '*' && month !== '?') {
    const monthNum = parseInt(month, 10);
    if (/^\d+$/.test(month) && monthNum >= 1 && monthNum <= 12) {
      parts.push(`in ${MONTH_NAMES[monthNum]}`);
    } else {
      parts.push(`in months: ${month}`);
    }
  }

  if (dow !== '*' && dow !== '?') {
    const dowNum = parseInt(dow, 10);
    if (/^\d+$/.test(dow) && dowNum >= 0 && dowNum <= 6) {
      parts.push(`on ${DAY_NAMES[dowNum]}`);
    } else {
      parts.push(`on days of week: ${dow}`);
    }
  }

  return parts;
}

function generateDescription(
  minute: string,
  hour: string,
  dom: string,
  month: string,
  dow: string
): string {
  const parts: string[] = [];

  if (minute === '*' && hour === '*') {
    parts.push('Every minute');
  } else if (minute === '*/5' && hour === '*') {
    parts.push('Every 5 minutes');
  } else if (minute === '*/15' && hour === '*') {
    parts.push('Every 15 minutes');
  } else if (minute === '0' && hour === '*') {
    parts.push('Every hour');
  } else if (minute !== '*' && hour !== '*') {
    const minStr = minute === '0' ? '00' : minute.padStart(2, '0');
    parts.push(`At ${hour.padStart(2, '0')}:${minStr}`);
  } else if (minute !== '*') {
    parts.push(`At minute ${minute}`);
  }

  parts.push(...scheduleSuffixParts(dom, month, dow));

  return parts.join(' ') || 'Custom schedule';
}

function generateNextRunDescription(
  minute: string,
  hour: string,
  dom: string,
  month: string,
  dow: string
): string {
  if (minute === '*' && hour === '*') return 'Every minute of every hour';
  if (minute === '*/5' && hour === '*') return 'Every 5 minutes';
  if (minute === '*/15' && hour === '*') return 'Every 15 minutes';
  if (minute === '0' && hour === '*') return 'At the start of every hour';

  if (minute === '0' && hour === '0' && dom === '*') {
    if (dow === '0') return 'Every Sunday at midnight';
    return 'Every day at midnight';
  }

  const minStr = minute === '0' ? '00' : minute.padStart(2, '0');
  const desc = `At ${hour.padStart(2, '0')}:${minStr}`;

  return [desc, ...scheduleSuffixParts(dom, month, dow)].join(' ');
}

const cronGeneratorConfig: CalculatorConfig = {
  inputs: [
    {
      id: 'preset',
      label: 'Preset Schedule',
      type: 'select',
      options: [
        { label: 'Every minute', value: 'Every minute' },
        { label: 'Every 5 minutes', value: 'Every 5 minutes' },
        { label: 'Every 15 minutes', value: 'Every 15 minutes' },
        { label: 'Every hour', value: 'Every hour' },
        { label: 'Daily at midnight', value: 'Daily at midnight' },
        { label: 'Weekly on Sunday', value: 'Weekly on Sunday' },
        { label: 'Monthly on 1st', value: 'Monthly on 1st' },
        { label: 'Custom', value: 'Custom' },
      ],
      helpText: 'Select a preset cron schedule or choose Custom to define your own',
    },
    {
      id: 'minute',
      label: 'Minute',
      type: 'number',
      min: 0,
      max: 59,
      showWhen: (values) => values.preset === 'Custom',
      helpText: 'Minute of the hour (0-59)',
    },
    {
      id: 'hour',
      label: 'Hour',
      type: 'number',
      min: 0,
      max: 23,
      showWhen: (values) => values.preset === 'Custom',
      helpText: 'Hour of the day (0-23)',
    },
    {
      id: 'dayOfMonth',
      label: 'Day of Month',
      type: 'number',
      min: 1,
      max: 31,
      showWhen: (values) => values.preset === 'Custom',
      helpText: 'Day of the month (1-31)',
    },
    {
      id: 'month',
      label: 'Month',
      type: 'number',
      min: 1,
      max: 12,
      showWhen: (values) => values.preset === 'Custom',
      helpText: 'Month of the year (1-12)',
    },
    {
      id: 'dayOfWeek',
      label: 'Day of Week',
      type: 'number',
      min: 0,
      max: 6,
      showWhen: (values) => values.preset === 'Custom',
      helpText: 'Day of the week: 0=Sunday, 1=Monday, ..., 6=Saturday',
    },
  ],
  calculate: (values) => {
    const preset = values.preset || 'Every minute';

    let minute: string;
    let hour: string;
    let dom: string;
    let month: string;
    let dow: string;
    let description: string;

    if (preset !== 'Custom') {
      const p = PRESETS[preset];
      if (!p) return [];
      minute = p.minute;
      hour = p.hour;
      dom = p.dom;
      month = p.month;
      dow = p.dow;
      description = p.description;
    } else {
      const minuteVal = (values.minute || '').trim();
      const hourVal = (values.hour || '').trim();
      const domVal = (values.dayOfMonth || '').trim();
      const monthVal = (values.month || '').trim();
      const dowVal = (values.dayOfWeek || '').trim();

      if (!minuteVal || !hourVal) return [];

      const minuteNum = parseInt(minuteVal, 10);
      const hourNum = parseInt(hourVal, 10);

      if (isNaN(minuteNum) || isNaN(hourNum)) return [];
      if (minuteNum < 0 || minuteNum > 59) return [];
      if (hourNum < 0 || hourNum > 23) return [];

      minute = String(minuteNum);
      hour = String(hourNum);
      dom = (!domVal || domVal === '*' || domVal === '?') ? '*' : String(parseInt(domVal, 10));
      month = (!monthVal || monthVal === '*' || monthVal === '?') ? '*' : String(parseInt(monthVal, 10));
      dow = (!dowVal || dowVal === '*' || dowVal === '?') ? '*' : String(parseInt(dowVal, 10));

      description = generateDescription(minute, hour, dom, month, dow);
    }

    const expression = `${minute} ${hour} ${dom} ${month} ${dow}`;
    const nextRunDesc = generateNextRunDescription(minute, hour, dom, month, dow);

    return [
      {
        id: 'expression',
        label: 'Cron Expression',
        value: expression,
        highlight: true,
        color: 'positive',
      },
      {
        id: 'description',
        label: 'Human-Readable Description',
        value: description,
        color: 'neutral',
      },
      {
        id: 'nextRun',
        label: 'Schedule',
        value: nextRunDesc,
        color: 'neutral',
      },
    ];
  },
  extraPanel: (values, results) => {
    if (!results.length) return null;
    return createElement(CronPanel, { values, results });
  },
  educational: {
    formula:
      'Cron = minute hour dayOfMonth month dayOfWeek | Each field: * = all, */N = every N, N = specific value, A-B = range, A,B,C = list',
    formulaDescription:
      'Cron is a time-based job scheduler in Unix-like operating systems. The cron daemon reads configuration files called crontabs and executes commands at specified times. The cron expression uses five space-separated fields to define the schedule precisely, supporting special characters for complex scheduling patterns.',
    variables: [
      {
        symbol: 'Minute',
        name: 'Minute Field',
        description:
          'Specifies the minute of the hour when the job runs. Values range from 0 to 59. Use * for every minute, */N for every N minutes, or comma-separated values.',
      },
      {
        symbol: 'Hour',
        name: 'Hour Field',
        description:
          'Specifies the hour of the day when the job runs. Uses 24-hour format with values ranging from 0 (midnight) to 23 (11 PM).',
      },
      {
        symbol: 'Day of Month',
        name: 'Day of Month Field',
        description:
          'Specifies the day of the month when the job runs. Values range from 1 to 31. Use * for every day or specific numbers for particular dates.',
      },
      {
        symbol: 'Day of Week',
        name: 'Day of Week Field',
        description:
          'Specifies the day of the week when the job runs. Values range from 0 (Sunday) to 6 (Saturday). Some systems also accept 7 as Sunday.',
      },
      {
        symbol: 'Special Chars',
        name: 'Special Characters',
        description:
          'Asterisk (*) means "every." Slash (/) specifies step values like */5 = every 5. Comma (,) separates lists like 1,3,5. Hyphen (-) defines ranges like 9-17.',
      },
    ],
    howToUse: [
      'Select a preset schedule (e.g., "Every hour", "Daily at midnight") for common cron patterns.',
      'For custom schedules, choose "Custom" and fill in the minute, hour, day of month, month, and day of week fields.',
      'Leave fields as blank in custom mode for them to default to wildcard (*).',
      'View the generated 5-field cron expression and its human-readable description.',
      'Copy the expression to use in your crontab file or scheduling system.',
    ],
    quickReference: [
      { label: '* * * * *', value: 'Every minute' },
      { label: '0 * * * *', value: 'Every hour' },
      { label: '0 0 * * *', value: 'Daily at midnight' },
      { label: '0 0 * * 0', value: 'Weekly on Sunday' },
    ],
    commonUses: [
      'Scheduling automated system maintenance tasks like log rotation and backups',
      'Running periodic data processing jobs (ETL pipelines, report generation)',
      'Triggering cron-based webhooks and API calls for scheduled integrations',
      'Automating certificate renewal (e.g., Let\'s Encrypt with certbot)',
      'Scheduling database cleanup, cache warming, and health check scripts',
    ],
    diagram: {
      svg: '<svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto"><rect x="30" y="20" width="380" height="300" fill="var(--svg-f8fafc)" stroke="var(--svg-e2e8f0)" stroke-width="1.5" rx="8"/><!-- Fields --><rect x="50" y="45" width="60" height="50" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="80" y="68" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Minute</text><text x="80" y="82" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">0-59</text><rect x="118" y="45" width="60" height="50" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="148" y="68" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Hour</text><text x="148" y="82" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">0-23</text><rect x="186" y="45" width="60" height="50" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="216" y="68" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Day</text><text x="216" y="82" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">1-31</text><rect x="254" y="45" width="60" height="50" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="284" y="68" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Month</text><text x="284" y="82" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">1-12</text><rect x="322" y="45" width="60" height="50" fill="var(--svg-dbeafe)" stroke="var(--svg-3b82f6)" stroke-width="1.5" rx="4"/><text x="352" y="68" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Weekday</text><text x="352" y="82" text-anchor="middle" font-size="9" fill="var(--svg-64748b)">0-6</text><!-- Arrow down --><line x1="220" y1="100" x2="220" y2="120" stroke="var(--svg-3b82f6)" stroke-width="2"/><polygon points="212,117 220,127 228,117" fill="var(--svg-3b82f6)"/><!-- Example box --><rect x="100" y="130" width="240" height="55" fill="var(--svg-f0fdf4)" stroke="var(--svg-22c55e)" stroke-width="1.5" rx="6"/><text x="220" y="151" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--svg-1e293b)">0 0 * * *</text><text x="220" y="168" text-anchor="middle" font-size="10" fill="var(--svg-64748b)">= "Daily at midnight"</text><text x="220" y="180" text-anchor="middle" font-size="9" fill="var(--svg-22c55e)">At 00:00 every day</text><!-- Arrow down --><line x1="220" y1="190" x2="220" y2="210" stroke="var(--svg-3b82f6)" stroke-width="2"/><polygon points="212,207 220,217 228,207" fill="var(--svg-3b82f6)"/><!-- Special chars --><rect x="60" y="215" width="320" height="85" fill="var(--svg-ffffff)" stroke="var(--svg-e2e8f0)" stroke-width="1" rx="4"/><text x="220" y="235" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--svg-1e293b)">Special Characters</text><text x="80" y="255" font-size="10" fill="var(--svg-64748b)">* = Every value</text><text x="260" y="255" font-size="10" fill="var(--svg-64748b)">*/N = Every N steps</text><text x="80" y="272" font-size="10" fill="var(--svg-64748b)">A,B = List of values</text><text x="260" y="272" font-size="10" fill="var(--svg-64748b)">A-B = Range</text></svg>',
      alt: 'Diagram showing the five cron expression fields (minute, hour, day of month, month, weekday) with an example expression and special characters legend',
      caption: 'Cron expression structure: five fields representing minute, hour, day of month, month, and day of week',
    },
    explanation:
      'Cron is the standard time-based job scheduler in Unix and Unix-like operating systems, including Linux and macOS. The name "cron" comes from the Greek word "chronos" meaning time. The cron daemon (crond) runs continuously in the background and wakes up every minute to check its configuration files (crontabs) for jobs that need to be executed at the current time. Each user can have their own crontab file, and the system has a system-wide crontab for administrative tasks. The cron expression format consists of five fields separated by spaces: minute, hour, day of month, month, and day of week. Each field can contain a specific value, a wildcard (*), a range (1-5), a list (1,3,5), or a step value (*/5 for every five). When a field is set to *, it matches all valid values. Step values with */N mean "every N units" — for example, */5 in the minute field means "every 5 minutes." Ranges with A-B match any value from A to B inclusive. Lists with comma-separated values match any of the listed values. One important behavior to understand is that when both day of month and day of week are specified (neither is *), the job runs when either condition is true — they are ORed together. This can sometimes lead to surprising scheduling behavior. Some cron implementations add a sixth field for the user to run the command as (in system crontab) or a seventh field for year. The standard 5-field form is the most widely used and is supported by virtually all cron implementations, as well as scheduling libraries and cloud services like AWS CloudWatch Events, Google Cloud Scheduler, and Azure Scheduler.',
    faqs: [
      {
        question: 'What does a cron expression look like?',
        answer: 'A cron expression is five space-separated fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), and day of week (0-6, where 0 is Sunday). For example, "30 4 * * 1-5" means "At 4:30 AM, Monday through Friday." The expression "0 0 1 * *" means "At midnight on the 1st of every month."',
      },
      {
        question: 'How do I run a job every 30 minutes?',
        answer: 'Use the expression "*/30 * * * *". The */30 in the minute field means "every 30 minutes." This will run at :00 and :30 of every hour, every day of the month, every month, and every day of the week.',
      },
      {
        question: 'What is the difference between cron and anacron?',
        answer: 'Cron assumes the system runs continuously. If the system is off when a job is scheduled, the job is skipped. Anacron (anachronistic cron) is designed for systems that don\'t run 24/7, like laptops and desktops. Anacron remembers when jobs should have run and executes them when the system is next powered on, ensuring scheduled tasks eventually run even if the system was offline.',
      },
      {
        question: 'How do I troubleshoot a cron job that isn\'t running?',
        answer: 'Check the cron daemon status (systemctl status cron on most Linux systems). Verify the crontab syntax (crontab -l and look for errors). Check cron logs in /var/log/cron or /var/log/syslog. Ensure the command in the cron job uses absolute paths. Verify file permissions — cron jobs run with limited environment variables. Redirect output to a log file to capture error messages (e.g., "*/5 * * * * /path/to/script >> /var/log/myscript.log 2>&1").',
      },
    ],
    citations: [
      { source: 'Wikipedia — Cron', url: 'https://en.wikipedia.org/wiki/Cron' },
      { source: 'cron man page (Linux man-pages)', url: 'https://man7.org/linux/man-pages/man5/crontab.5.html' },
    ],
  },
};

export default cronGeneratorConfig;
