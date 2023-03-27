import dayjs from 'dayjs';

import relativeTime from 'dayjs/plugin/relativeTime';

class Clock {
  async setTimeoutWithLogging(timeoutInMs: number, interval: number, message: (timeElapsed: number, timeRemaining: number) => boolean) {
    let timeElapsed = 0;
    let should_continue = true;

    while (should_continue && timeElapsed < timeoutInMs) {
      await this.setTimeout(interval)

      timeElapsed += interval;
      const timeRemaining = timeoutInMs - timeElapsed;

      should_continue = message(timeElapsed, timeRemaining);
    }
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
