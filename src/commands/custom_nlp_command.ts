import * as _ from "underscore"
import config from "../config"
import { Looker } from "../looker"
import { DashboardQueryRunner } from "../repliers/dashboard_query_runner"
import { ReplyContext } from "../reply_context"
import { Command } from "./command"
import * as AWS from "aws-sdk"

export class CustomNlpCommand extends Command {

  public attempt(context: ReplyContext) {

    AWS.config.update({ region: 'eu-west-1' });

    var lexruntime = new AWS.LexRuntime();

    var params = {
      botAlias: '$LATEST', /* required, has to be '$LATEST' */
      botName: 'lookerbot', /* required, the name of you bot */
      inputText: context.sourceMessage.text.toLowerCase(), /* required, your text */
      userId: 'lookerbot' /* required, arbitrary identifier */
    };

    lexruntime.postText(params, function (err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        return false
      }
      else {
        console.log(data);           // successful response

        if (!data.intentName) {
          console.log("Cannot find intent");
          context.replyPrivate(":crying_cat_face: " + data.message);
          return false;
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
