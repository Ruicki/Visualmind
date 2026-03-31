import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const content = {
    'shipping': {
        title: 'Información de Envíos',
        body: `
            <h3 style="font-size:1.2rem;font-weight:700;color:white;margin-bottom:1rem">Envíos a Panamá y el Mundo</h3>
            <p style="margin-bottom:1.5rem;color:#9ca3af">Realizamos envíos a nivel nacional e internacional. Todos los pedidos se procesan en un plazo de 1 a 3 días hábiles. Los tiempos de entrega varían según la ubicación, pero generalmente oscilan entre 5 y 10 días hábiles para pedidos internacionales.</p>
            
            <h3 style="font-size:1.2rem;font-weight:700;color:white;margin-bottom:1rem">Seguimiento de Pedido</h3>
            <p style="margin-bottom:1.5rem;color:#9ca3af">Una vez que tu pedido sea despachado, recibirás un número de seguimiento por correo electrónico para que puedas rastrear su camino hasta tu puerta.</p>

            <h3 style="font-size:1.2rem;font-weight:700;color:white;margin-bottom:1rem">Aduanas e Impuestos</h3>
            <p style="color:#9ca3af">Los pedidos internacionales pueden estar sujetos a cargos de aduana o impuestos al llegar a tu país. Estos cargos son responsabilidad del cliente.</p>
        `
    },
    'returns': {
        title: 'Devoluciones y Cambios',
        body: `
            <h3 style="font-size:1.2rem;font-weight:700;color:white;margin-bottom:1rem">Política de 30 Días</h3>
            <p style="margin-bottom:1.5rem;color:#9ca3af">Ofrecemos una política de devolución de 30 días para todos los artículos sin usar en su empaque original. Si han pasado más de 30 días desde tu compra, lamentablemente no podemos ofrecerte un reembolso o cambio.</p>
            
            <h3 style="font-size:1.2rem;font-weight:700;color:white;margin-bottom:1rem">Cómo Devolver</h3>
            <p style="margin-bottom:1.5rem;color:#9ca3af">Para iniciar una devolución, contáctanos en soporte@visualmind.com con tu número de pedido. Te proporcionaremos una etiqueta de envío de devolución e instrucciones.</p>

            <h3 style="font-size:1.2rem;font-weight:700;color:white;margin-bottom:1rem">Reembolsos</h3>
            <p style="color:#9ca3af">Una vez recibida e inspeccionada tu devolución, te notificaremos por correo electrónico sobre la aprobación o rechazo de tu reembolso.</p>
        `
    },
    'faq': {
        title: 'Preguntas Frecuentes',
        body: `
            <div style="margin-bottom:2rem">
                <h3 style="font-size:1.1rem;font-weight:700;color:white;margin-bottom:0.5rem">¿Cómo encuentro mi talla?</h3>
                <p style="color:#9ca3af">Tenemos una guía de tallas completa en cada página de producto. Si no estás seguro, recomendamos elegir una talla más grande para un ajuste más holgado.</p>
            </div>
            
            <div style="margin-bottom:2rem">
                <h3 style="font-size:1.1rem;font-weight:700;color:white;margin-bottom:0.5rem">¿Puedo cancelar mi pedido?</h3>
                <p style="color:#9ca3af">Puedes cancelar tu pedido dentro de las 24 horas posteriores a realizarlo. Contáctanos de inmediato si necesitas hacer cambios.</p>
            </div>

            <div>
                <h3 style="font-size:1.1rem;font-weight:700;color:white;margin-bottom:0.5rem">¿Dónde están ubicados?</h3>
                <p style="color:#9ca3af">Visualmind es una marca panameña con diseños originales y envíos a todo el mundo.</p>
            </div>
        `
    }
};

export default function InfoPage() {
    const { page } = useParams();
    const data = content[page] || { title: 'Página no encontrada', body: '<p>La página solicitada no existe.</p>' };

    return (
        <div style={{ paddingTop: '140px', paddingBottom: '100px', minHeight: '100vh', background: '#050505', color: 'white' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '3rem', textDecoration: 'none' }}>
                    <ArrowLeft size={20} /> Volver al Inicio
                </Link>

                <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '3rem' }}>{data.title}</h1>

                <div
                    dangerouslySetInnerHTML={{ __html: data.body }}
                    style={{ lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-secondary)' }}
                />
            </div>
        </div>
    );
}
