import angular from 'angular';

import main from './main.controller';
import imageUpload from './image-upload.directive';
import viewer from './viewer.directive';

const module = angular.module('stSpots', []);

module.controller('MainController', main);
module.directive('imageUpload', imageUpload);
module.directive('viewer', viewer);
