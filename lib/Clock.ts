import dayjs from 'dayjs';

import relativeTime from 'dayjs/plugin/relativeTime';

class Clock {
  async setTimeoutWithLogging(timeoutInMs: number, interval: number, message: (timeElapsed: number, timeRemaining: number) => void) {
    let loggerInterval;
    let timeElapsed = 0;

    loggerInterval = setInterval(() => {
      timeElapsed = timeElapsed + interval;
      const timeRemaining = timeoutInMs - timeElapsed;

      message(timeElapsed, timeRemaining);
    }, interval);

    this.setTimeout(timeoutInMs).then(() => {
      clearInterval(loggerInterval);
    });
  }

  async setTimeout(timeout: number) {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, timeout);
    })
  }

  static dayjs(...args) {
    dayjs.extend(relativeTime);

    return dayjs(...args);
  }
}

export default Clock;
