import { Campaign } from './campaign';
import { loadCampaignSave, saveCampaign } from './save';
export class Game {

  // battleMode = new BattleMode()
  campaignSave = loadCampaignSave()
  campaign: Campaign | undefined = new Campaign(this.seed, this.campaignSave)
  constructor(public seed: number) {

    const a = document.createElement('div')
    a.textContent = 'awd'
    a.className = 'button'
    a.style.zIndex = '1000'
    a.style.position = 'fixed'
    a.onclick = async () => {
      if (this.campaign) {
        this.campaignSave = await saveCampaign(this.campaign, undefined, false)
        this.campaign.end()
        delete this.campaign
      } else {
        this.campaign = new Campaign(this.seed, this.campaignSave)
      }
    }
    document.body.appendChild(a)
  }

}
