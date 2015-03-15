'use strict';

// Topic creates a global pub/sub dispatcher. Code pulled from jquery documentation
// http://api.jquery.com/jQuery.Callbacks/
// example usage:
// $.Topic( "mailArrived" ).subscribe( fn1 );
// $.Topic( "mailArrived" ).publish( "hello world!" );

var topics = {};
jQuery.Topic = function( id ) {
    var callbacks,
        topic = id && topics[ id ];
    if ( !topic ) {
        callbacks = jQuery.Callbacks();
        topic = {
            publish: callbacks.fire,
            subscribe: callbacks.add,
            unsubscribe: callbacks.remove
        };
        if ( id ) {
            topics[ id ] = topic;
        }
    }
    return topic;
};
