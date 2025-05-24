export function formatDateTime(date: Date): string {
  // Create a date in Bangladesh timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const bangladeshTime = new Intl.DateTimeFormat('en-US', options)
    .format(new Date())
    .replace(
      /(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/,
      '$3-$1-$2 $4:$5:$6'
    );

  return bangladeshTime;
}