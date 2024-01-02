const { Plugin } = require("obsidian");

class TimerPlugin extends Plugin {
  onload() {
    let timer;
    let timerInterval;
    let timerStarted = false;

    // Add status bar item
    let statusBarEl = this.addStatusBarItem();
    statusBarEl.setText("Start Timer");

    // Helper function to format time
    function formatTime(seconds) {
      let hours = Math.floor(seconds / 3600);
      seconds %= 3600;
      let minutes = Math.floor(seconds / 60);
      seconds %= 60;
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""
        }${seconds}`;
    }

    // Add click event listener
    statusBarEl.addEventListener("click", async () => {
      if (!timerStarted) {
        timer = new Date();
        timerStarted = true;

        // Start interval to update status bar text
        timerInterval = setInterval(() => {
          let elapsedSeconds = Math.round((new Date() - timer) / 1000);
          statusBarEl.setText("Elapsed Time: " + formatTime(elapsedSeconds));
        }, 1000);
      } else {
        clearInterval(timerInterval);
        let elapsedSeconds = Math.round((new Date() - timer) / 1000);
        timerStarted = false;
        statusBarEl.setText("Start Timer");

        // Append to daily note
        let dailyNoteFilename =
          "Daily Notes/" + new Date().toISOString().split("T")[0];
        let dailyNote = this.app.vault.getAbstractFileByPath(
          dailyNoteFilename + ".md"
        );

        if (!dailyNote) {
          // If the daily note does not exist, create it
          dailyNote = await this.app.vault.create(
            dailyNoteFilename + ".md",
            ""
          );
        }

        // Parse previous elapsed times and cumulative time
        let cumulativeSeconds = 0;
        let timeParts;

        let dailyNoteContent = await this.app.vault.read(dailyNote);

        let dailyNoteLines = dailyNoteContent.split("\n");

        for (let line of dailyNoteLines) {
          if (line.startsWith("Cumulative Time: ")) {
            timeParts = line
              .replace("Cumulative Time: ", "")
              .split(":")
              .map(Number);
            cumulativeSeconds +=
              timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
          }
        }

        // Remove the old line start start with `Cumulative Time` if there is one
        dailyNoteLines = dailyNoteLines.filter(
          (line) => !line.startsWith("Cumulative Time: ")
        );

        // If this is the first time entry of the day, add a border
        if (!dailyNoteLines.some(line => line.startsWith('Elapsed Time: '))) {
          const border = '*'.repeat(80);
          dailyNoteLines.push(border);
        }

        // Append new elapsed time and cumulative time

        cumulativeSeconds += elapsedSeconds;
        let newElapsed = "Elapsed Time: " + formatTime(elapsedSeconds);
        let newCumulative = "Cumulative Time: " + formatTime(cumulativeSeconds);
        dailyNoteLines.push(newElapsed, newCumulative);

        try {
          await this.app.vault.modify(dailyNote, dailyNoteLines.join("\n"));
        } catch (error) {
          console.error('Error appending to daily note:', error);
        }
      }
    });
  }
}

module.exports = TimerPlugin;
