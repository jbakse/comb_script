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

// Topic creates a global pub/sub dispatcher. Code jquery documentation
// http://api.jquery.com/jQuery.Callbacks/
// example usage:
// $.Topic( "mailArrived" ).subscribe( fn1 );
// $.Topic( "mailArrived" ).publish( "hello world!" );

