import { join } from 'path';
import { ILocale, ILocaleEntry } from '../main/main-interface';
import { NestedLocale } from '../nested-locale/nested-locale';
import { INestedResource, IResource } from './locale-cache-interface';

export class LocaleCache implements ILocale {
  private resources: IResource;

  private nestedResources: INestedResource = {};

  public getResources(): IResource {
    const { resources } = this;

    return resources;
  }

  public async setResources(entry: ILocaleEntry): Promise<void> {
    const { language, localeFolderPath } = entry;
    const resourceDirectory: string = join(localeFolderPath, `/${language}.json`);
    const resources: string = await this.readTextFile(resourceDirectory);

    this.resources = JSON.parse(resources);
  }

  public translate(key: string): string {
    const { resources } = this;
    const { [key]: value } = resources;

    return typeof value === 'string' ? value : JSON.stringify(value) || key;
  }

  public getCollection(chain: string): NestedLocale {
    const nestedResources: IResource = this.getNestedObject(chain);

    return new NestedLocale(nestedResources);
  }

  private async readTextFile(filePath: string): Promise<string> {
    const rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType('application/json');
    rawFile.open('GET', filePath, true);

    return new Promise<string>((resolve): void => {
      rawFile.onreadystatechange = () => {
        if (rawFile.readyState === 4 && rawFile.status === 200) {
          resolve(rawFile.responseText);
        }
      };
      rawFile.send(null);
    });
  }

  private getNestedObject(chain: string): IResource {
    if (!this.nestedResources[chain]) {
      const splitChain: string[] = chain.split('.');
      let { resources } = this;

      splitChain.forEach((value: string): void => {
        const nestedResources: IResource | string = resources[value];
        if (typeof nestedResources === 'object') {
          resources = nestedResources;
        } else {
          throw new Error('The value of your requested chain is not an object');
        }
      });

      this.nestedResources[chain] = resources;
    }

    return this.nestedResources[chain];
  }
}
