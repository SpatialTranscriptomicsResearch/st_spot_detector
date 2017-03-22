from datetime import datetime

class Logger:
    """Logs messages to a text file"""

    def __init__(self, filename, toFile=True):
        self.log_file = open(filename, "a")
        self.to_file = toFile
        self.log("Opening self for logging.")

    def log(self, message):
        prefix = datetime.now().strftime("[%Y-%m-%d %H:%M:%S] ")
        if(self.to_file):
            self.log_file.write(prefix + message + "\n")
        else:
            print(prefix + message)
