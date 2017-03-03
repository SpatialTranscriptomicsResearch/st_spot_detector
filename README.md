# ST Aligner

A web tool for automatic spot detection and positional adjustments for ST Datasets. 

The arrays used to generate ST Datasets may contain positional variations due to printing artifacts. This web tool aims to detect correct spot positions using the Cy3 using the Cy3 fluorescence image, and then generate a file that can be used to adjust the coordinates of ST data.

NOTE: this software is currently not yet fully functional and is in a testing stage of development. 

## Dependencies
The server uses Python 2.7 with the libraries OpenCV-Python and Pillow (PIL Fork) for image processing. These can easily be installed within a virtual environment using pip and requirements.txt (see Usage).
It also uses another [tissue recognition library](https://github.com/ludvb/tissue_recognition). 

A modern browser with HTML5 support is required for the front-end interface. The web app has been tested on the lastest version of Chrome and Firefox.

## Usage
### Download
1. Clone the repository

    ```
    git clone https://github.com/SpatialTranscriptomicsResearch/st_aligner.git
    ```
2. Move into the directory
    ```
    cd st_aligner
    ```

### Server setup (all `pip` and `Python` commands assume Python 2)
1. Install the necessary packages (OS-dependent command)
    e.g. on Ubuntu/Debian
    ```
        sudo apt-get install python2.7 python-pip
    ```

2. Create and activate a Python virtual environment 

    ```
    pip install virtualenv
    virtualenv venv
    source venv/bin/activate
    ```

3. Install the dependencies in requirements.txt.

    ```
    pip install -r requirements.txt
    ```

4. Install the tissue recognition library (still within the Python virtual environment). Follow the instructions [here.](https://github.com/ludvb/tissue_recognition)

5. Set up uWSGI
    a uWSGI daemon can be installed, e.g. on Ubuntu/Debian
    ```
    sudo apt-get install uwsgi uwsgi-core uwsgi-plugin-python
    ```
    or it may be installed within the Python virtual environment
    ```
    pip install uwsgi
    ```

6. Edit the uWSGI configuration file uwsg-server-config.ini
    The following lines require editing
    ```
    chdir = /path/to/server/file/directory/
    logto = /path/to/log/file/directory/%n.log
    plugin = /path/to/python/plugin/ 
    virtualenv = /path/to/virtual/env
    ```

    They may for example look like
    ```
    chdir = /home/user/st_aligner/
    logto = /home/user/.st_log/%n.log
    plugin = /usr/lib/uwsgi/plugins/python_plugin.so
    virtualenv = /home/user/st_aligner/venv/
    ```

7. Run the server
    uWSGI may then either be daemonized, e.g. on Ubuntu/Debian

    ```
    # the file must be copied to the uwsgi directory
    sudo cp uwsgi-server-config.ini /etc/uwsgi/apps-available/
    # and symlinked to the apps-enabled folder
    sudo ln -s /etc/uwsgi/apps-available/uwsgi-server-config.ini /etc/uwsgi/apps-enabled/uwsgi-server-config.ini
    # then the service may be started
    sudo service uwsgi start
    ```
    or run locally
    ```
    uwsgi uwsgi-server-config.ini
    ```

8. Optional
    The server may be configured to run with nginx or Apache (not covered here).
    It may also be desirable to configure port-forwarding to be able to access the web tool through port 80, e.g. on Ubuntu/Debian
    ```
    sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -i eth0 -j DNAT --to 0.0.0.0:8080

    ```

For any queries or concerns, feel free to contact the authors at the addresses given below.

### Client interface
1. Select the desired Cy3 fluorescent image to undergo spot detection and click "Upload Image" (takes a minute or two). An HE image may also be uploaded if desired; it is necessary that the two images have been previously aligned in Photoshop or similar. The images may be cropped, as long as the outer frame is totally intact, but they may not be scaled down.
2. Drag the lines to onto the outer "frame" of the spots, making sure that the lines intersect through approximately the middle of the spots.
  1. It is possible to navigate around the image with right-click and scroll-wheel to zoom.
3. Click "Detect Spots" (will take another minute or two)
4. Spot adjustment:
  1. Navigate around the image with right-click and scroll-wheel to zoom.
  2. Select spots with left-click (or Ctrl+click) and move selected spots with right click, or delete them using the "Delete selected spots" button.
  3. Add to the selection by pressing in shift and selecting additional spots.
  4. If the HE image has been uploaded, then spots within the tissue boundaries may automatically be selected by clicking on the "Select spots within tissue" button.
  4. Add additional spots by clicking the "Add Spots" button and then left-clicking where they should be placed (right-click and scroll-wheel navigates around the image).
  5. Return to the selection mode by clicking on the "Finish adding spots" button.
5. Export the spot values by clicking the "Export Spot Data" button. Either all the spots, or the current selection can be exported, in either adjusted array or pixel coordinates.

## License
MIT (see LICENSE).

## Authors
See AUTHORS. 

## Contact
Kim Wong <kim.wong@scilifelab.se>
Jose Fernandez <jose.fernandez.navarro@scilifelab.se>
