import template from 'assets/html/modal.html';

import 'bootstrap/js/modal';

import $ from 'jquery';

function spawnModal(title, contents, container = document.body) {
    const modal = $(template).prependTo(container);
    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(contents);
    modal.on('hidden.bs.modal', () => modal.remove());
    modal.modal('show');
}

export default spawnModal;
