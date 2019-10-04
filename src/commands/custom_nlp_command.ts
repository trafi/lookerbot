import * as _ from "underscore"
import config from "../config"
import { Looker } from "../looker"
import { DashboardQueryRunner } from "../repliers/dashboard_query_runner"
import { ReplyContext } from "../reply_context"
import { Command } from "./command"
import * as AWS from "aws-sdk"

export class CustomNlpCommand extends Command {

  public attempt(context: ReplyContext) {

    AWS.config.update({ region: process.env.region });

    var lexruntime = new AWS.LexRuntime();

    var params = {
      botAlias: process.env.AWS_LEX_BOT_ALIAS, /* required, has to be '$LATEST' */
      botName: process.env.AWS_LEX_BOT_NAME, /* required, the name of you bot */
      inputText: context.sourceMessage.text.toLowerCase(), /* required, your text */
      userId: process.env.AWS_LEX_BOT_USER /* required, arbitrary identifier */
    };

    lexruntime.postText(params, function (err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        return false
      }
      else {

        if (!data || !data.intentName) {
          console.log("Cannot find intent: " + data);
          context.replyPrivate(":crying_cat_face: Cannot detect intent. Check Lex config.");
          return false;
        } else {
           console.log("Detected intent: " + data.intentName);
        }

        const normalizedText = data.intentName!.toLowerCase()
        const shortCommands = _.sortBy(_.values(Looker.customCommands), (c) => -c.name.length)
        const matchedCommand = shortCommands.filter((c) => normalizedText.indexOf(c.name) === 0)[0]
        if (matchedCommand) {

          if (data.message) context.replyPrivate(":smirk_cat: " + data.message);

          const { dashboard } = matchedCommand
          const query = matchedCommand.name
          normalizedText.indexOf(matchedCommand.name)
          context.looker = matchedCommand.looker

          const runner = new DashboardQueryRunner(context, matchedCommand.dashboard, {})
          runner.start()

          return true
        } else {
          return false
        }
      }
    });

    return false
  }
}
