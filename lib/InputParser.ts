import * as core from '@actions/core';

import yml from 'js-yaml';
import fs from 'fs';
import path from 'path';

interface ActionDefaultValues {
  inputs: {
    [name: string]: {
      default?: string
    }
  }
}

class InputParser {
  private pathToActionYaml = path.join(__dirname, '../action.yml');

  private action: ActionDefaultValues;

  constructor() {
    this.action = yml.load(fs.readFileSync(this.pathToActionYaml, 'utf8'));
  }

  private getDefaultValue(name: string): string {
    return this.action?.inputs?.[name]?.default;
  }

  getWait(): number {
    const waitInput = Number(core.getInput('wait'));

    if (!waitInput || waitInput <= 0) {
      return Number(this.getDefaultValue('wait'));
    }

    return waitInput;
  }

  getToken(): string {
    const tokenInput = core.getInput('token');

    if (!tokenInput) {
      return this.getDefaultValue('token');
    }

    return tokenInput;
  }
}

export default InputParser;
