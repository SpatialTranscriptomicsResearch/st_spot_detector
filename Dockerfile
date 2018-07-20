# HOW TO:
#
# First build this image with:
#    docker build -t spot_detector:latest ./
#
# Then to start the container running the server run:
#    docker run -d -p 8080:8080 --name spotdetector_deamon -i spot_detector:latest
#
# For an interactive session run:
#    docker run -p 8080:8080 --name spotdetector -ti spot_detector:latest bash
# Then within the container run:
#     cd /opt/repos/st_spot_detector/server && python -m app
#
# FINALLY: use chrome/firefox or something to go to http://0.0.0.0:8080
# also feel free to run with wsgi instead if you think thats fun

FROM ubuntu:18.04

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update
RUN apt-get install apt-utils --yes
RUN apt-get upgrade --yes
RUN apt-get install -y tzdata
RUN apt-get install -y build-essential \
                       cmake \
                       git \
                       wget \
                       curl \
                       zlib1g-dev \
                       libbz2-dev \
                       liblzma-dev \
                       libopencv-dev \
                       pkg-config \
                       libjpeg8-dev \
                       libtiff5-dev \
                       libavcodec-dev \
                       libavformat-dev \
                       libswscale-dev \
                       libv4l-dev \
                       libxvidcore-dev \
                       libx264-dev \
                       libgtk-3-dev \
                       libatlas-base-dev \
                       gfortran \
                       curl \
                       libboost-all-dev

# get nodejs 10
WORKDIR /opt/
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

# install python and packages
RUN apt-get install -y python3-pip python3-dev python3-tk \
  && cd /usr/local/bin \
  && ln -s /usr/bin/python3 python \
  && pip3 install --upgrade pip
RUN pip install --upgrade pip
RUN pip install numpy
RUN pip install setuptools

# make a dir or the repos
RUN mkdir /opt/repos

# setup and install st_tissue_recognition
WORKDIR /opt/repos
RUN git clone https://github.com/SpatialTranscriptomicsResearch/st_tissue_recognition.git
WORKDIR /opt/repos/st_tissue_recognition
RUN mkdir /opt/repos/st_tissue_recognition/build
WORKDIR /opt/repos/st_tissue_recognition/build
RUN cmake ../
RUN make install
WORKDIR /opt/repos/st_tissue_recognition/python-module/
RUN python setup.py install
RUN echo "export LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH" >> $HOME/.bashrc

# setup the st spot detector
WORKDIR /opt/repos
RUN git clone https://github.com/elhb/st_spot_detector.git
WORKDIR /opt/repos/st_spot_detector
RUN git pull
RUN git checkout docker
RUN pip install -r server/requirements.txt
WORKDIR /opt/repos/st_spot_detector/client
RUN npm install
RUN make dist 

# set ldlibrarypath, port and start command
ENV LD_LIBRARY_PATH /usr/local/lib:$LD_LIBRARY_PATH
EXPOSE 8080
WORKDIR /opt/repos/st_spot_detector/server
CMD ["python","-m","app"]

COPY Dockerfile /opt