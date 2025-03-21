import { CharacterPartType, CharacterCustomization, AnimationType } from '../character/types/CharacterData';

export class CharacterCustomizationUI {
  private container: HTMLDivElement;
  private onPartChange: (type: CharacterPartType, partId: string) => void;
  private onColorChange: (materialName: string, color: string) => void;
  private onAnimationChange: (type: AnimationType) => void;

  constructor(
    containerId: string,
    onPartChange: (type: CharacterPartType, partId: string) => void,
    onColorChange: (materialName: string, color: string) => void,
    onAnimationChange: (type: AnimationType) => void
  ) {
    this.container = document.getElementById(containerId) as HTMLDivElement;
    this.onPartChange = onPartChange;
    this.onColorChange = onColorChange;
    this.onAnimationChange = onAnimationChange;
  }

  public render(customization: CharacterCustomization): void {
    this.container.innerHTML = '';

    // Create sections for different customization options
    this.createPartSelection(customization);
    this.createColorSelection(customization);
    this.createAnimationSelection();
  }

  private createPartSelection(customization: CharacterCustomization): void {
    const section = document.createElement('div');
    section.className = 'customization-section';
    section.innerHTML = '<h3>Character Parts</h3>';

    for (const [type, part] of Object.entries(customization.parts)) {
      const partType = type as CharacterPartType;
      const select = document.createElement('select');
      select.className = 'part-select';
      select.dataset.type = partType;
      select.innerHTML = `<option value="${part.id}">${part.name}</option>`;
      
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.onPartChange(partType, target.value);
      });

      section.appendChild(select);
    }

    this.container.appendChild(section);
  }

  private createColorSelection(customization: CharacterCustomization): void {
    const section = document.createElement('div');
    section.className = 'customization-section';
    section.innerHTML = '<h3>Colors</h3>';

    for (const [materialName, color] of Object.entries(customization.colors)) {
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = color;
      colorInput.dataset.material = materialName;
      
      colorInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.onColorChange(target.dataset.material!, target.value);
      });

      section.appendChild(colorInput);
    }

    this.container.appendChild(section);
  }

  private createAnimationSelection(): void {
    const section = document.createElement('div');
    section.className = 'customization-section';
    section.innerHTML = '<h3>Animations</h3>';

    const select = document.createElement('select');
    select.className = 'animation-select';

    Object.values(AnimationType).forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.onAnimationChange(target.value as AnimationType);
    });

    section.appendChild(select);
    this.container.appendChild(section);
  }
} 