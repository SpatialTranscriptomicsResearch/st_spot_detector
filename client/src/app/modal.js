import htmlModal from 'assets/html/modal.html';
import htmlButton from 'assets/html/modal-button.html';

import 'bootstrap/js/src/modal';

import $ from 'jquery';
import _ from 'lodash';

function spawnModal(
    title,
    contents,
    {
        buttons = [['Close', _.noop]],
        container = document.body,
    } = {},
) {
    const modal = $(htmlModal).prependTo(container);
    modal.find('.modal-title').html(title);
    modal.find('.modal-body').html(contents);
    const footer = modal.find('.modal-footer');
    _.each(
        _.map(
            buttons,
            ([text, action]) => $(htmlButton).html(text).click(action),
        ),
        x => footer.append(x),
    );
    modal.on('hidden.bs.modal', () => modal.remove());
    modal.modal();
}

function error(message, kwargs = {}) {
    spawnModal('Error', message === null ? 'Unkown error' : message, kwargs);
}

function warning(message, kwargs = {}) {
    spawnModal('Warning', message === null ? 'Unkown warning' : message, kwargs);
}

export default spawnModal;
export { error, warning };
