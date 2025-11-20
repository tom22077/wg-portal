import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import IpCalculator from '@/views/IPCalculatorView.vue'
import { createI18n } from 'vue-i18n' 

vi.mock('cidr-tools', () => {
  return {
    excludeCidr: vi.fn((allowed, disallowed) => { 
        return ['11.0.0.0/8', '172.32.0.0/12', '192.169.0.0/16']; 
    }),
    exclude: vi.fn((allowed, disallowed) => { 
        return ['11.0.0.0/8', '172.32.0.0/12', '192.169.0.0/16'];
    }),
  }
})

const i18n = createI18n({
    legacy: false, 
    locale: 'en',
    messages: {
        en: {
            'calculator.headline': 'IP Calculator Headline',
            'calculator.abstract': 'IP Calculator Abstract',
            'calculator.allowed-ip.label': 'Allowed IP Label',
            'calculator.allowed-ip.placeholder': 'allowed',
            'calculator.dissallowed-ip.label': 'Disallowed IP Label',
            'calculator.dissallowed-ip.placeholder': 'dissallowed',
            'calculator.button-exclude-private': 'Exclude Private IPs',
            'calculator.headline-allowed-ip': 'Allowed IP Result',
            'calculator.new-allowed-ip.placeholder': 'New Allowed IP',
            'calculator.dissallowed-ip.invalid': 'Invalid address',
            'calculator.allowed-ip.invalid': 'Invalid address',
            'calculator.allowed-ip.empty': 'Value cannot be empty',
        }
    },
})

const globalMountingOptions = {
    global: {
        plugins: [i18n], 
    }
}

describe('IP Calculator View', () => {

    it('renders input fields correctly', () => {
        const wrapper = mount(IpCalculator, globalMountingOptions)
        const inputs = wrapper.findAll('input')
        expect(inputs.length).toBeGreaterThanOrEqual(2)
    })

    it('shows error when invalid allowed IP is entered', async () => {
        const wrapper = mount(IpCalculator, globalMountingOptions)
        const allowedInput = wrapper.find('input[placeholder*="allowed"]')
        
        await allowedInput.setValue('invalid_ip')
        await allowedInput.trigger('blur')
        await wrapper.vm.$nextTick()
        
        expect(wrapper.text()).toContain('Invalid address')
    })

    it('clears error for valid allowed IP', async () => {
        const wrapper = mount(IpCalculator, globalMountingOptions)
        const allowedInput = wrapper.find('input[placeholder*="allowed"]')
        
        await allowedInput.setValue('192.168.1.0/24')
        await allowedInput.trigger('blur')
        await wrapper.vm.$nextTick()
        
        expect(wrapper.find('.text-danger').exists()).toBe(false)
    })

    it('validates disallowed IP input', async () => {
        const wrapper = mount(IpCalculator, globalMountingOptions)
        const disallowedInput = wrapper.find('input[placeholder*="dissallowed"]')
        
        await disallowedInput.setValue('invalid')
        await disallowedInput.trigger('blur')
        await wrapper.vm.$nextTick()
        
        expect(wrapper.text()).toContain('Invalid address')
    })

    it('computes excluded IPs correctly', async () => {
        const wrapper = mount(IpCalculator, globalMountingOptions)
        
        await wrapper.find('input[placeholder*="allowed"]').setValue('0.0.0.0/0')
        await wrapper.find('input[placeholder*="dissallowed"]').setValue('10.0.0.0/8')
        await wrapper.vm.$nextTick()

        const resultText = wrapper.find('textarea').element.value
        
        const expectedCidrs = ['11.0.0.0/8', '172.32.0.0/12', '192.169.0.0/16'].join(', ')
        
        expect(resultText).toContain(expectedCidrs)
    })

    it('adds private IPs when button is clicked', async () => {
        const wrapper = mount(IpCalculator, globalMountingOptions)
        const button = wrapper.find('button') 
        
        await button.trigger('click')
        await wrapper.vm.$nextTick()
        
        expect(wrapper.vm.dissallowedIp).toContain('192.168.0.0/16')
    })

    it('avoids duplicating private IPs when adding them twice', async () => {
        const wrapper = mount(IpCalculator, globalMountingOptions)
        const button = wrapper.find('button')

        await button.trigger('click')
        const first = wrapper.vm.dissallowedIp.split(',').filter(ip => ip.trim()).length
        
        await button.trigger('click')
        const second = wrapper.vm.dissallowedIp.split(',').filter(ip => ip.trim()).length

        expect(second).toBe(first)
    })
})