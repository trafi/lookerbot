import config from "./config"

import { Commander } from "./commander"
import { Looker } from "./looker"
import { SlackService } from "./services/slack_service"
import { VersionChecker } from "./version_checker"

const state: any = {
  VersionChecker: new VersionChecker(),
}

// Connect to all the Looker instances
Looker.loadAll()

state.VersionChecker = new VersionChecker()

// Update access tokens every half hour
setInterval(() => {
  for (const looker of Looker.all) {
    looker.client.fetchAccessToken()
  }
}, 30 * 60 * 1000)

const commands = [
  require("./commands/custom_nlp_command").CustomNlpCommand
]

const listeners = [
]

state.commander = new Commander(new SlackService(), {
  commands,
  listeners,
})
