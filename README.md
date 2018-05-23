# ST Spot Detector
A web tool for automatic spot detection and positional adjustments for ST datasets.

The arrays used to generate ST datasets may contain positional variations due to printing artifacts. This web tool aims to detect correct spot positions using the images generated from the ST protocol.
In order to obtain relevant experimental data, it is also possible to automatically select the spots which are located under the tissue, using a corresponding HE image.
The spot positions and selections are further adjustable to one's own needs.
A file is generated which contains the corrected spot coordinates of the ST data as adjusted array coordinates and pixel coordinates as well as file containing a 3x3 affine matrix to transform array coordinates to pixel coordinates which can be useful for downstream analysis.

## <a name="dependencies"></a>Dependencies
The following packages are required:
```
Python 3.6+
Node.js 10.0+
npm 6.0+
```
Additionally, the [ST tissue recognition library](https://github.com/SpatialTranscriptomicsResearch/st_tissue_recognition) needs to be installed.

A modern browser is required for the front-end interface.
The web app has been tested on Chrome 66 and Firefox 60.

## Usage
If you want to deploy the ST Spot detector locally on your computer
you can use this [singularity](https://github.com/SpatialTranscriptomicsResearch/st_spot_detector_singularity)
container. Otherwise follow the deployment instructions below.

### Download
1. Clone the repository

    ```
    git clone https://github.com/SpatialTranscriptomicsResearch/st_spot_detector.git
    ```
2. Move into the directory
    ```
    cd st_spot_detector
    ```

### Server setup
1. Install the [dependencies](#dependencies)

2. Create and activate a Python virtual environment

    ```
    pip install virtualenv
    virtualenv venv
    source venv/bin/activate
    ```

3. Install the dependencies in requirements.txt.

    ```
    cd server
    pip install -r requirements.txt
    ```

4. Install the tissue recognition library (still within the Python virtual environment). Follow the instructions [here.](https://github.com/SpatialTranscriptomicsResearch/st_tissue_recognition)

5. Build the client side files:

    ```
    cd ../client
    npm install
    make dist
    ```

6. Run the server with the following command:
    ```
    cd ../server
    python -m app
    ```
    The server is WSGI-compatible and can, alternatively, be run with a WSGI
    server of your choice.

7. *Optional*.
    It may be desirable to configure port-forwarding to be able to access the web tool through port 80, e.g. using iptables:
    ```
    sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -i eth0 -j DNAT --to 0.0.0.0:8080

    ```

For any queries or concerns, feel free to contact the authors at the addresses given below.

### Manual
For a guide on using the ST spots detection tool, please refer to [this guide.](https://github.com/SpatialTranscriptomicsResearch/st_spot_detector/wiki/ST-Spot-Detector-Usage-Guide)

## License
MIT (see LICENSE).

## Authors
See AUTHORS.

## Contact
Kim Wong <kim.wong@scilifelab.se><br />
Jose Fernandez <jose.fernandez.navarro@scilifelab.se>
