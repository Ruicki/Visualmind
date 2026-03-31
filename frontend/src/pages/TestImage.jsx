import React from 'react';

export default function TestImage() {
    const pathsToTest = [
        '/Post/Dandadan/dandan-turbo-abuela.jpeg',
        '/public/Post/Dandadan/dandan-turbo-abuela.jpeg',
        'Post/Dandadan/dandan-turbo-abuela.jpeg',
        './Post/Dandadan/dandan-turbo-abuela.jpeg',
        '/Post/Dandadan/dandan-turbo-abuela.jpg', // Case sensitive extension check
        '/post/dandadan/dandan-turbo-abuela.jpeg', // Lowercase check
    ];

    return (
        <div style={{ paddingTop: '150px', paddingBottom: '100px', background: '#111', minHeight: '100vh', color: 'white', textAlign: 'center' }}>
            <h1>Image Path Diagnostic</h1>
            <p>We are testing which path works for your browser.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '2rem' }}>
                {pathsToTest.map((path, index) => (
                    <div key={index} style={{ border: '1px solid #333', padding: '1rem', borderRadius: '10px' }}>
                        <p style={{ color: 'orange', fontFamily: 'monospace', wordBreak: 'break-all' }}>{path}</p>
                        <img
                            src={path}
                            alt={`Test ${index}`}
                            style={{ width: '200px', height: '200px', objectFit: 'contain', background: '#000', margin: '0 auto', display: 'block' }}
                            onError={(e) => {
                                e.target.style.border = '2px solid red';
                            }}
                            onLoad={(e) => {
                                e.target.style.border = '2px solid green';
                            }}
                        />
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
                            Border Green = Works<br />
                            Border Red = Fails
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
