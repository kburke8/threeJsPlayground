import { ProgressionManager } from './ProgressionManager';
import { MetaUpgrade, PlayerProgress, RunStats } from './types/ProgressionTypes';

export class ProgressionUI {
  private container: HTMLElement;
  private progressionManager: ProgressionManager;

  constructor(containerId: string, progressionManager: ProgressionManager) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id ${containerId} not found`);
    }
    this.container = container;
    this.progressionManager = progressionManager;

    this.initialize();
  }

  private initialize(): void {
    this.container.innerHTML = `
      <div class="progression-ui">
        <div class="stats-panel">
          <h2>Run Statistics</h2>
          <div id="run-stats"></div>
        </div>
        <div class="resources-panel">
          <h2>Resources</h2>
          <div id="resources"></div>
        </div>
        <div class="upgrades-panel">
          <h2>Meta Upgrades</h2>
          <div id="upgrades-list"></div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .progression-ui {
        padding: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        font-family: Arial, sans-serif;
      }

      .stats-panel, .resources-panel, .upgrades-panel {
        margin-bottom: 20px;
        padding: 15px;
        border: 1px solid #444;
        border-radius: 5px;
      }

      .upgrade-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        margin: 5px 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }

      .upgrade-info {
        flex-grow: 1;
      }

      .upgrade-name {
        font-weight: bold;
        color: #4CAF50;
      }

      .upgrade-description {
        font-size: 0.9em;
        color: #BBB;
      }

      .upgrade-level {
        color: #FFC107;
      }

      .upgrade-button {
        padding: 5px 15px;
        background: #4CAF50;
        border: none;
        border-radius: 3px;
        color: white;
        cursor: pointer;
      }

      .upgrade-button:disabled {
        background: #666;
        cursor: not-allowed;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
      }

      .resources {
        font-size: 1.2em;
        color: #FFC107;
      }
    `;
    document.head.appendChild(style);

    this.update();
  }

  public update(): void {
    this.updateRunStats();
    this.updateResources();
    this.updateUpgrades();
  }

  private updateRunStats(): void {
    const progress = this.progressionManager.getProgress();
    const currentRun = this.progressionManager.getCurrentRun();
    const statsContainer = document.getElementById('run-stats');
    if (!statsContainer) return;

    let statsHtml = `
      <div class="stat-item">
        <span>Total Runs:</span>
        <span>${progress.totalRuns}</span>
      </div>
      <div class="stat-item">
        <span>Total Enemies Defeated:</span>
        <span>${progress.statistics.totalEnemiesDefeated}</span>
      </div>
      <div class="stat-item">
        <span>Total Damage Dealt:</span>
        <span>${Math.floor(progress.statistics.totalDamageDealt)}</span>
      </div>
    `;

    if (currentRun) {
      statsHtml += `
        <h3>Current Run</h3>
        <div class="stat-item">
          <span>Wave:</span>
          <span>${currentRun.wave}</span>
        </div>
        <div class="stat-item">
          <span>Enemies Defeated:</span>
          <span>${currentRun.enemiesDefeated}</span>
        </div>
        <div class="stat-item">
          <span>Resources Gained:</span>
          <span>${currentRun.resourcesGained}</span>
        </div>
      `;
    }

    if (progress.bestRun) {
      statsHtml += `
        <h3>Best Run</h3>
        <div class="stat-item">
          <span>Wave Reached:</span>
          <span>${progress.bestRun.wave}</span>
        </div>
        <div class="stat-item">
          <span>Resources Gained:</span>
          <span>${progress.bestRun.resourcesGained}</span>
        </div>
      `;
    }

    statsContainer.innerHTML = statsHtml;
  }

  private updateResources(): void {
    const progress = this.progressionManager.getProgress();
    const resourcesContainer = document.getElementById('resources');
    if (!resourcesContainer) return;

    resourcesContainer.innerHTML = `
      <div class="resources">
        ${progress.resources} <span style="color: #FFC107;">⭐</span>
      </div>
    `;
  }

  private updateUpgrades(): void {
    const progress = this.progressionManager.getProgress();
    const upgradesContainer = document.getElementById('upgrades-list');
    if (!upgradesContainer) return;

    let upgradesHtml = '';
    progress.metaUpgrades.forEach((upgrade) => {
      upgradesHtml += this.createUpgradeElement(upgrade, progress.resources);
    });

    upgradesContainer.innerHTML = upgradesHtml;

    // Add event listeners
    progress.metaUpgrades.forEach((upgrade) => {
      const button = document.getElementById(`upgrade-button-${upgrade.id}`);
      if (button) {
        button.addEventListener('click', () => this.handleUpgradePurchase(upgrade.id));
      }
    });
  }

  private createUpgradeElement(upgrade: MetaUpgrade, resources: number): string {
    const canAfford = resources >= upgrade.cost;
    const maxLevel = upgrade.currentLevel >= upgrade.maxLevel;
    const buttonDisabled = !canAfford || maxLevel;

    return `
      <div class="upgrade-item">
        <div class="upgrade-info">
          <div class="upgrade-name">${upgrade.name}</div>
          <div class="upgrade-description">${upgrade.description}</div>
          <div class="upgrade-level">Level ${upgrade.currentLevel}/${upgrade.maxLevel}</div>
        </div>
        <button 
          id="upgrade-button-${upgrade.id}"
          class="upgrade-button"
          ${buttonDisabled ? 'disabled' : ''}
        >
          ${maxLevel ? 'MAX' : `Upgrade (${upgrade.cost} ⭐)`}
        </button>
      </div>
    `;
  }

  private handleUpgradePurchase(upgradeId: string): void {
    if (this.progressionManager.purchaseUpgrade(upgradeId)) {
      this.update();
    }
  }

  public show(): void {
    this.container.style.display = 'block';
    this.update();
  }

  public hide(): void {
    this.container.style.display = 'none';
  }
} 