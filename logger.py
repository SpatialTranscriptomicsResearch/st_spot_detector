from datetime import datetime

class Logger:
    """Logs messages to a text file"""

    def __init__(self, filename, toFile=True):
        self.filename = filename
        self.to_file = toFile

    def log(self, message):
        prefix = datetime.now().strftime("[%Y-%m-%d %H:%M:%S] ")
        if(self.to_file):
            with open(self.filename, 'a') as log_file:
                log_file.write(prefix + message + "\n")
        else:
            print(prefix + message)
