import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import 'spinkit/css/spinners/10-fading-circle.css';

import 'assets/css/stylesheet.css';
import 'assets/html/index.html';

import angular from 'angular';

import aligner from './aligner.directive';
import main from './main.controller';
import imageUpload from './image-upload.directive';
import viewer from './viewer.directive';

const app = angular.module('stSpots', []);

app.controller('MainController', main);
app.directive('imageUpload', imageUpload);
app.directive('viewer', viewer);
app.directive('aligner', aligner);
