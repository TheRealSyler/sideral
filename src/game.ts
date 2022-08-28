import { Battlemode } from './battlemode';
import { Campaign } from './campaign';
import { loadBattlemodeSave, loadCampaignSave, saveCampaign } from './save';
export class Game {
  isInCampaign = false
  battleModeSave = loadBattlemodeSave()
  battleMode: Battlemode | undefined = undefined
  campaignSave = loadCampaignSave()
  campaign: Campaign | undefined = undefined
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


    if (this.isInCampaign) {
      this.campaign = new Campaign(this.seed, this.campaignSave)
    } else {
      this.battleMode = new Battlemode(
        { soldiers: [{ name: 'awd', range: 4 }, { name: 'test', range: 6 }] },
        {
          soldiers: [
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'bob' },
            { team: 'ai', name: 'gary' }
          ]
        }, this.battleModeSave)
    }
  }

}
