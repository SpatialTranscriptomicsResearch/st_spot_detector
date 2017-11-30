/**
 * @module worker-return-codes
 */

/**
 * Enum of messages that can be sent to the worker.
 */
const Messages = Object.freeze({
    AFLTR: 'Apply filters',
    GFLTR: 'Get filters',
    RGHST: 'Register histogram',
});

/**
 * Enum of response codes used by the worker.
 */
const Responses = Object.freeze({
    SUCCESS: 0,
    FAILURE: 1,
});

export { Messages, Responses };
