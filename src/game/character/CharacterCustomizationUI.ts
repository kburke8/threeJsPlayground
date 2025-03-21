import { CharacterCustomization, CharacterPart, CharacterPartType } from './types/CharacterData';

export class CharacterCustomizationUI {
  private container: HTMLElement;
  private customization: CharacterCustomization;
  private onCustomizationChange: (customization: CharacterCustomization) => void;

  constructor(
    containerId: string,
    initialCustomization: CharacterCustomization,
    onCustomizationChange: (customization: CharacterCustomization) => void
  ) {
    this.container = document.getElementById(containerId) || document.createElement('div');
    this.customization = initialCustomization;
    this.onCustomizationChange = onCustomizationChange;
    this.initializeUI();
  }

  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="customization-panel">
        <h2>Character Customization</h2>
        <div class="customization-sections">
          ${this.createPartSection()}
          ${this.createColorSection()}
        </div>
      </div>
    `;

    // Add event listeners
    this.addPartChangeListeners();
    this.addColorChangeListeners();
  }

  private createPartSection(): string {
    return `
      <div class="customization-section">
        <h3>Parts</h3>
        ${Object.entries(this.customization.parts)
          .map(([type, part]) => `
            <div class="customization-item">
              <label for="${type}">${this.formatLabel(type)}</label>
              <select id="${type}" class="part-select">
                <option value="${part.id}" selected>${part.name}</option>
              </select>
            </div>
          `)
          .join('')}
      </div>
    `;
  }

  private createColorSection(): string {
    return `
      <div class="customization-section">
        <h3>Colors</h3>
        ${Object.entries(this.customization.colors)
          .map(([material, color]) => `
            <div class="customization-item">
              <label for="color-${material}">${this.formatLabel(material)}</label>
              <input type="color" id="color-${material}" value="${color}">
            </div>
          `)
          .join('')}
      </div>
    `;
  }

  private addPartChangeListeners(): void {
    Object.keys(this.customization.parts).forEach((type) => {
      const select = this.container.querySelector(`#${type}`) as HTMLSelectElement;
      if (select) {
        select.addEventListener('change', (e) => {
          const target = e.target as HTMLSelectElement;
          const partType = type as CharacterPartType;
          this.customization.parts[partType] = {
            ...this.customization.parts[partType],
            id: target.value,
          };
          this.onCustomizationChange(this.customization);
        });
      }
    });
  }

  private addColorChangeListeners(): void {
    Object.keys(this.customization.colors).forEach((material) => {
      const input = this.container.querySelector(`#color-${material}`) as HTMLInputElement;
      if (input) {
        input.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement;
          this.customization.colors[material] = target.value;
          this.onCustomizationChange(this.customization);
        });
      }
    });
  }

  private formatLabel(text: string): string {
    return text
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  public updateCustomization(newCustomization: CharacterCustomization): void {
    this.customization = newCustomization;
    this.initializeUI();
  }
} 